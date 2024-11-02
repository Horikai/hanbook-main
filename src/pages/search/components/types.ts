import type YuukiPS from "@/api/yuukips";
import type { GmhandbookGI } from "@/types/gm";
import type { Data } from "@/types/hsr";

export type CurrentType = "Genshin Impact" | "Star Rail";

export interface State {
    mainData: GmhandbookGI[];
    mainDataSR: Data[];
    searchTerm: string;
    searchInputValue: string;
    loading: boolean;
    error: boolean;
    errorMessage: string;
    listCategory: { label: string; value: string }[];
    currentType: CurrentType;
    selectedCategory: string[];
    showImage: boolean;
    showCommands: boolean;
    showCommandsSR: boolean;
    currentLimit: number;
    yuukips: YuukiPS | null;
    output: string[];
    limitsResult: number;
    isHandbookLoading: boolean;
    baseURL: string;
}
