export interface IAnalyzedSection {
    index: string;
    rootNode: boolean;
    section: string;
    sentences: ISentence[];
    title: string;
    url: string;
}

export interface ISentence {
    info: IInfo;
    sentence: string;
}

export interface IInfo {
    verbs: IVerb[];
    words: string[];
}

export interface IVerb {
    description: string;
    tags: string[];
    verb: string;
}