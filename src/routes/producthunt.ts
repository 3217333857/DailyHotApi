import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { parseRSS } from "../utils/parseRSS.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "producthunt",
    title: "Product Hunt",
    type: "Today",
    description: "The best new products, every day",
    link: "https://www.producthunt.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://www.producthunt.com/feed";
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/atom+xml,application/xml,text/xml,*/*"
    }
  });

  try {
    const list = await parseRSS(result.data);
    return {
      ...result,
      data: list.map((item, index) => ({
        id: item.guid || `ph-${index}`,
        title: item.title || "",
        desc: item.content?.replace(/<[^>]*>/g, '').trim() || "",
        author: item.author || "",
        timestamp: getTime(item.pubDate || 0),
        hot: undefined,
        url: item.link || "",
        mobileUrl: item.link || "",
      })),
    };
  } catch (error) {
    throw new Error(`Failed to parse Product Hunt RSS: ${error}`);
  }
}; 