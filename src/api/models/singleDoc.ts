export interface IStoreAllReq {
  title: string;
  index: string;
  section: string;
  url: string;
  rootNode: boolean;
}

export interface ISingleDoc {
  word: string;
  body: {
    title: string;
    date: Date;
    section: string;
    url: string;
    rootNode: boolean;
  };
}
