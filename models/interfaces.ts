/* tslint:disable:max-classes-per-file */
export interface Section {
  title: string | undefined;
  index: string | undefined;
  section: string | undefined;
  url: string | undefined;
  rootNode: boolean | undefined;
}

export interface AllSections {
  url: string | undefined;
  data: Section[] | undefined;
}

export interface IndividualSentence {
  word: string | undefined;
  body:
    | {
        date: string | undefined;
        url: string | undefined;
        sentences: string | undefined;
      }
    | undefined;
}

export interface EsDoc {
  _index: string | undefined;
  _type: string | undefined;
  _id: string | undefined;
  _score: number | undefined;
  _source: Source | undefined;
}

export interface Source {
  section: string | undefined;
  title: string | undefined;
  url: string | undefined;
  date: string | undefined;
  rootNode: boolean | undefined;
}

export interface ScrapedSentencesObj {
  word: string | undefined;
  body:
    | {
        date: string | Date;
        url: string | undefined;
        sentences: string | any[] | undefined;
      }
    | undefined;
}

export interface EsIndex {
  health: string | undefined;
  status: string | undefined;
  index: string | undefined;
  uuid: string | undefined;
  pri: string | undefined;
  rep: string | undefined;
  "docs.count": string;
  "docs.deleted": string;
  "store.size": string;
  "pri.store.size": string;
}

export interface Entity {
  name: String;
  type: string; // EntityType
  attributes: Object;
  influencers?: any[];
  relatedEntities?: any[];
  synonyms?: any[];
  wateringHoles?: any[];
  dateCreated?: string;
  dateModified?: string;
}


export interface Extraction {
  url: string;
	dateCreated: string;
	dateModified: string;
	entities: {name: string, type: string}[]

	sections: [
		{
			sectionNumber: number,
			firstSentence: string,
			ontologyWords: string[],
			ontologyLemminizedWords:string[],
			ontologyMatchedSentence: string[][]
			// bubble up the section entities to the page lvl
			sectionEntities: {name: string, type: string}[]
		}
	]

}
// let page = {
// 	url: 'www.personality.com',
// 	dateCreated: 12/23/2021,
// 	dateCreated: 12/23/2021,
// 	entities: [
// 		{name: 'Entj', type: 'Personality'},
// 		{name:'Washington DC', type:'Location'},
// 		{name:'Elon Musk', type:'Person'}
// 	],
// 	sections: [
// 		{
// 			sectionNumber: 1,
// 			firstSentence: "A personality can tell you alot",
// 			ontologyWords: ['entj', person],
// 			ontologyLemminizedWords:['entj', entity],
// 			ontologyMatchedSentence: [
// 				['This is an entj', 'Entjs are super cool'],
// 				['People are cool', 'This one guy did a thing']
// 			],
// 			// bubble up the section entities to the page lvl
// 			sectionEntities: [
// 				{name: 'Entj', type: 'Personality'},
// 				{name:'WashingtonDC', type:'Location'}
// 			]
// 		}
// 	]
// }
