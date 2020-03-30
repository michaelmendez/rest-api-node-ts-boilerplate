export class Scraping {
    title: string | undefined;

    index: string | undefined;

    section: string | undefined;

    url: string | undefined;

    rootNode: boolean | undefined;
}

export class AllScrapings {
    url: string | undefined;

    data: Scraping[] | undefined;
}

export class IndividualSentence {
    word: string | undefined;

    body: {
        date: string | undefined;
        url: string | undefined;
        sentences: string | undefined;
    } | undefined
}

export class EsDoc {
    _index: string | undefined;

    _type: string | undefined;

    _id: string | undefined;

    _score: number | undefined;

    _source: Source | undefined;
}

export class Source {
    section: string | undefined;

    title: string | undefined;

    url: string | undefined;

    date: string | undefined;

    rootNode: boolean | undefined;
}

export class ScrapedSentencesObj {
    word: string | undefined;

    body: {
        date: string | Date;
        url: string | undefined;
        sentences: string | any[] | undefined;
    } | undefined;
}

export class EsIndex {
    health: string | undefined;

    status: string | undefined;

    index: string | undefined;

    uuid: string | undefined;

    pri: string | undefined;

    rep: string | undefined;

    'docs.count': string;

    'docs.deleted': string;

    'store.size': string;

    'pri.store.size': string;
}
