// Generated by https://quicktype.io

export interface Hsr {
    status: number;
    message: string;
    data: Data[];
}

export enum MainMissionType {
    Branch = "Branch",
    Companion = "Companion",
    Daily = "Daily",
    Gap = "Gap",
    Main = "Main",
}

export interface Data {
    id: number;
    name: NameClass;
    image: ImageClass | string | undefined;
    rarity?: number;
    baseType?: string;
    damageType?: string;
    description: NameClass | undefined;
    command?: Command;
    category: string;
    list?: ListRelicItem[];
    nextMission: number | undefined;
    type: MainMissionType | undefined;
    level?: number;
}

export interface Command {
    command_1: Command1_Class;
    command_2?: Command1_Class;
    command_3?: Command1_Class;
    command_4?: Command1_Class;
    command_5?: Command1_Class;
}

export interface Command1_Class {
    name: string;
    value: string;
}

export interface ImageClass {
    icon: string;
    card?: string;
}

export interface NameClass {
    en: string;
    id: string;
    jp: string;
    ru: string;
    th: string;
    chs: string;
    cht: string;
    fr: string;
}

export interface ListRelicItem {
    id: number;
    name: NameClass;
    image?: string | ImageClass;
    rarity: number;
    command: Command;
}