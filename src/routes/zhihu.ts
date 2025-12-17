import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { config } from "../config.js"

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "zhihu",
    title: "知乎",
    type: "热榜",
    link: "https://www.zhihu.com/hot",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = `https://api.zhihu.com/topstory/hot-lists/total?limit=50`;
  const result = await get({
      url,
      noCache,
      headers: {
        "User-Agent": "osee2unifiedRelease/4358 osee2unifiedReleaseVersion/7.8.0 Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        "x-api-version": "3.0.91",
        ...(config.ZHIHU_COOKIE && { Cookie: config.ZHIHU_COOKIE })
      }
    });
  const list = result.data.data;
  return {
    ...result,
    data: list.map((v: any) => {
      const target = v.target;
      // 从 link.url 或 card_id 提取 question id
      let questionId = "";
      if (target?.link?.url) {
        const match = target.link.url.match(/question\/(\d+)/);
        if (match) questionId = match[1];
      }
      if (!questionId && v.card_id) {
        const match = v.card_id.match(/Q_(\d+)/);
        if (match) questionId = match[1];
      }
      // 解析热度
      let hot = 0;
      const metricsText = target?.metrics_area?.text || "";
      const match = metricsText.match(/(\d+(?:\.\d+)?)\s*万/);
      if (match) {
        hot = parseFloat(match[1]) * 10000;
      }
      return {
        id: questionId || v.id,
        title: target?.title_area?.text || "",
        desc: target?.excerpt_area?.text || "",
        cover: target?.image_area?.url || "",
        timestamp: undefined,
        hot,
        url: `https://www.zhihu.com/question/${questionId}`,
        mobileUrl: `https://www.zhihu.com/question/${questionId}`,
      };
    }),
  };
};
