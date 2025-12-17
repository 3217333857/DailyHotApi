import type { RouterType } from "../router.types.js";
import type { ListItem, RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { parseChineseNumber } from "../utils/getNum.js";
import UserAgent from "user-agents";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "kuaishou",
    title: "快手",
    type: "热榜",
    description: "快手，拥抱每一种生活",
    link: "https://www.kuaishou.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = `https://www.kuaishou.com/?isHome=1`;
  const userAgent = new UserAgent({
    deviceCategory: "desktop",
  });
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent": userAgent.toString(),
    },
  });
  const listData: ListItem[] = [];
  // 获取主要内容
  const pattern = /window\.__APOLLO_STATE__=(.*);\(function\(\)/s;
  const matchResult = result.data?.match(pattern);
  if (!matchResult || !matchResult[1]) {
    return { ...result, data: [] };
  }
  const jsonObject = JSON.parse(matchResult[1])["defaultClient"];
  // 获取所有分类
  const hotRankKey = Object.keys(jsonObject).find(k => k.includes('visionHotRank') && k.includes('"page":"home"'));
  if (!hotRankKey) {
    return { ...result, data: [] };
  }
  const allItems = jsonObject[hotRankKey]?.["items"];
  if (!allItems) {
    return { ...result, data: [] };
  }
  // 获取全部热榜
  allItems?.forEach((item: { id: string }) => {
    // 基础数据
    const hotItem: RouterType["kuaishou"] = jsonObject[item.id];
    if (!hotItem) return;
    const photoId = hotItem.photoIds?.json?.[0];
    const poster = hotItem.poster ? decodeURIComponent(hotItem.poster) : "";
    listData.push({
      id: hotItem.id || hotItem.name,
      title: hotItem.name,
      cover: poster,
      hot: hotItem.hotValue ? parseChineseNumber(hotItem.hotValue) : undefined,
      timestamp: undefined,
      url: photoId ? `https://www.kuaishou.com/short-video/${photoId}` : `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(hotItem.name)}`,
      mobileUrl: photoId ? `https://www.kuaishou.com/short-video/${photoId}` : `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(hotItem.name)}`,
    });
  });
  return {
    ...result,
    data: listData,
  };
};
