const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, `solved.json`);

const tiers = [
    'UnRated', 'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    'Platinum V', 'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond V', 'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
    'Ruby V', 'Ruby IV', 'Ruby III', 'Ruby II', 'Ruby I'
];

const levelToText = (level) => tiers[level] || "Unknown";

/** 
 * 해당 유저가 최근 푼 문제를 가져오는 함수 (백준 기준 한 페이지)
 */
const getRecentSolved = async (handle) => {
    const url = `https://www.acmicpc.net/status?option-status-pid=on&problem_id=&user_id=${handle}&language_id=-1&result_id=4`;
    const seen = new Set();
    const recent = [];
    try {
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
                "Referer": "https://www.acmicpc.net/",
                "Accept-Language": "ko,en;q=0.9"
            }
        });

        const $ = cheerio.load(res.data);
        const rows = $("table.table tbody tr");

        for (const row of rows) {
            const tds = $(row).find("td");
            const problemLink = tds.eq(2).find("a");
            const problemId = parseInt(problemLink.text().trim(), 10);
            const title = problemLink.attr("title") || "(제목 없음)";
            const problemUrl = "https://www.acmicpc.net" + (problemLink.attr("href") || "");
            const solvedRes = await axios.get(`https://solved.ac/api/v3/problem/lookup?problemIds=${problemId}`);
            const rank = levelToText(solvedRes.data[0].level);

            if (!isNaN(problemId) && !seen.has(problemId)) {
                seen.add(problemId);
                recent.push({
                    problemId,
                    title,
                    url: problemUrl,
                    rank
                });
            }
        }
    } catch (err) {
        console.error("크롤링 실패:", err.message);
    }
    return recent;
}

/**
 * 해당 유저가 푼 모든 문제를 가져오는 함수
 */
const getSolvedProblems = async (handle) => {
    let page = 1;
    let allProblems = [];

    try {
        while (true) {
            const res = await axios.get("https://solved.ac/api/v3/search/problem", {
                params: {
                    query: `solved_by:${handle}`,
                    page,
                    size: 50
                },
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept-Language": "ko,en;q=0.9",
                    "Referer": "https://solved.ac/"
                }
            });
            const items = res.data.items;
            if (!items || items.length === 0) break;

            const problemIds = items.map(p => p.problemId);
            allProblems.push(...problemIds)

            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    } catch (err) {
        console.error("에러 발생:", err.message);
    }
    return allProblems;
}

/**
 * 처음 접속한 유저 추가
 */
const firstJoin = async (handle) => {
    const problems = await getSolvedProblems(handle);
    const savedData = getJson();
    savedData[handle] = problems;
    fs.writeFileSync(filePath, JSON.stringify(savedData, null, 2), "utf-8");
}

const getJson = () => {
    const fileData = fs.readFileSync(filePath, "utf-8");
    const savedData = JSON.parse(fileData);
    return savedData;
}

/**
 * 저장소에 저장되지 않은 새로 푼 문제만 가져오는 함수
 */
const getNewlySolved = async (handle) => {
    const savedData = getJson();
    const oldProblems = new Set(savedData[handle]);

    const recent = await getRecentSolved(handle);
    const newlySolved = recent.filter(p => !oldProblems.has(p.problemId));

    for (const problem of newlySolved) {
        savedData[handle].push(problem.problemId);
    }

    savedData[handle].sort((a, b) => a - b);
    fs.writeFileSync(filePath, JSON.stringify(savedData, null, 2), "utf-8");
    return newlySolved;
}

const getRandomProblemByRank = async (rank, count) => {
    const users = getUsers();
    const problem = await axios.get(`https://solved.ac/api/v3/search/problem`, {
        params: {
            query: "!solved_by:rlatjwls3333 *"+rank,
            page: 1,
            sort: "random",
            direction: "asc"
        },
    });

    let problems = [];
    for(let i=0;i<count && problem.data.items.length;i++) {
        const problemId = problem.data.items[i].problemId;
        const title = problem.data.items[i].titleKo;
        const url = "https://www.acmicpc.net/problem/"+problemId;
        const rank = levelToText(problem.data.items[i].level);
        problems.push({
                    problemId,
                    title,
                    url,
                    rank
                });
    }
    return problems;
}

/**
 * 문제 추천
 */
const recommendProblems = async () => {
    const ranks = {
        b: 5, s: 3, g: 2, p: 0, d: 0, r: 0
    };

    let problems = [];
    for(const [rank, count] of Object.entries(ranks)) {
        if(count>0) {
            const problem = await getRandomProblemByRank(rank, count);
            problems.push(...problem);
        }
    }
    return problems;
}

const getUserData = (userID) => {
    let url= "https://solved.ac/api/v3/user/show?" + new URLSearchParams({handle: userID})

    let result = fetch(url, {headers : {
            "Accept": "application/json", 
            "x-solvedac-language": "ko" 
        }}).then((res) => {
            return res.json()
        })

    return result
}

module.exports = {
    getRecentSolved,
    firstJoin,
    getNewlySolved,
    getJson,
    getSolvedProblems,
    recommendProblems,
    getUserData,
}
