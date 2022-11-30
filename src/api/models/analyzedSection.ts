export interface IAnalyzedSection {
    index: string;
    rootNode?: boolean;
    section: string;
    sectionSub?: ISectionsub
    sentences: ISentence[];
    title: string;
    url: string;
}

export interface ISentence {
    info: IInfo;
    spacy?: SpacyInfo
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

interface ISectionsub {
  antecedent_indices: number[][]
  clusters: number[][][]
  document: string[]
  predicted_antecedents: number[]
  top_spans: number[][]
}

interface SpacyInfo {
  entities: Entity[]
  tokens: Token[]
}
interface Entity{
  end: number
  label: string
  start: number
  text: string
}
interface Token{
  deb: string
  lemma: string
  pos: string
  tag: string
  text:string
}
