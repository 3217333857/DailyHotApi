import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { parseRSS } from "../utils/parseRSS.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "linuxdo",
    title: "Linux.do",
    type: "热门文章",
    description: "Linux 技术社区热搜",
    link: "https://linux.do/top",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://linux.do/top.rss";
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml,application/xml,text/xml,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity"
    }
  });

  const list = await parseRSS(result.data);
  return {
    ...result,
    data: list.map((item, index) => ({
      id: item.guid || `linuxdo-${index}`,
      title: item.title || "",
      desc: item.content?.replace(/<[^>]*>/g, '').substring(0, 200).trim() || "",
      author: item.author || "",
      timestamp: getTime(item.pubDate || 0),
      hot: undefined,
      url: item.link || "",
      mobileUrl: item.link || "",
    })),
  };
}; 