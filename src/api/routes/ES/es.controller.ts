import { client } from '../../elasticsearch'
import search from './searchES'

import { Request, Response } from 'express';

export default class EsController {

    public esHealth = async (req: Request, res: Response): Promise<any> => {
        return client.cluster.health({}).then((resp: any) => {
            if (resp) {
                return res.json({
                    response: resp
                })
            } else {
                return res.json({
                    err: 'error getting client health'
                })
            }
        })
    };

    public esCatIndicies = async (req: Request, res: Response): Promise<any> => {
        client.cat
            .indices({
                format: 'json',
                v: true
            })
            .then((resp: any) => {
                // console.log('-- Client Health --', resp)
                res.json({
                    response: resp
                })
            })
    };

    public esCreateIndex = async (req: Request, res: Response): Promise<any> => {
        return this.createESIndex(req.params.word).then(resp => {
            if (resp) {
                return res.json({
                    response: resp
                })
            } else {
                return res.json({
                    err: 'error creating index'
                })
            }
        })
    };

    public esDeleteIndex = async (req: Request, res: Response): Promise<any> => {
        client.indices.delete(
            {
                index: req.params.word
            }).then((err: any, resp: any) => {
                if (err) {
                    console.log(err)
                    res.json({
                        err
                    })
                } else {
                    console.log('create', resp)
                    res.json({
                        response: resp
                    })
                }
            }
            )
    };

    public esAddDoc = async (req: Request, res: Response): Promise<any> => {
        // const result = await client.search({
        //   index: req.body.word,
        // })
        console.log('req: ' + req)
        console.log('req.body: ' + req.body)
        console.log('req.body.word: ' + req.body.word)
        const result = await client.cat.indices({
            index: req.body.word,
            format: 'json'
        })

        console.log('cat index: ' + req.body.word + '?')
        console.log('response= ' + result)

        // if no index
        if (result.error) {
            console.log('creating new index')
            client.indices.create(
                {
                    index: req.body.word
                }).then((err: any, resp: any) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('create ' + resp)
                    }
                }
                )
        }
        console.log('adding doc !!! ' + result)

        client
            .index({
                index: req.body.word,
                // id: '1',
                type: '_doc',
                body: req.body.body
            })
            .then((resp: any) => {
                if (resp) {
                    return res.json({
                        response: resp
                    })
                } else {
                    return res.json({
                        err: 'error adding doc'
                    })
                }
            })
    };

    public esCreate = async (req: Request, res: Response): Promise<any> => {
        client.indices.create(
            {
                index: 'gov'
            }).then((resp: any) => {
                if (resp) {
                    console.log('create', resp)
                }
            }
            )
    };

    public esSearch = async (req: Request, res: Response): Promise<any> => {
        return client.search(req.body).then(async (response: any) => {
            if (response) {
                console.log('--- Response ---')
                // console.log(response)
                const word = req.body.body.query.bool.must.query_string.query
                console.log('--- Hits ---')
                const message = await search.clusterSearch(response.hits.hits, word)
                res.json({
                    response: message
                })
            }
        })
    };

    public esSearchIndex = async (req: Request, res: Response): Promise<any> => {
        return client.search(req.body).then((resp: any) => {
            if (resp) {
                console.log('--- Response ---')
                res.json({
                    response: resp.hits.hits
                })
            }
        })
    };

    public esStreamResults = async (req: Request, res: Response): Promise<any> => {
        const response: any = await client.search(req.body)
        // .then((response: any) => {
        if (response) {
            console.log('--- Response ---')
            // console.log(response)
            const word = req.body.body.query.bool.must.query_string.query
            console.log('--- Hits ---')
            search.clusterSearch(response.hits.hits, word)
            // launchChrome()
            res.json({
                response: response.hits.hits
            })
        }
        // })
    };

    /// ///////////////////////////// helper functions /////////////////////

    public esAddSentences = async (req: Request, res: Response): Promise<any> => {
        try {
            const docAddedResponse = await client.index({
                index: req.body.word,
                type: '_doc',
                body: req.body.body
            })
            if (docAddedResponse.result === 'created') {
                console.log('doc inserted ')
                return {
                    result: docAddedResponse,
                    message: 'Doc added'
                }
            } else {
                console.log('eeeeerrr')
                return {
                    error: docAddedResponse
                }
            }
        } catch (e) {
            console.log('failed to insert Sentences doc ' + e)
            return {
                error: e,
                result: 'failed to inset doc'
            }
        }
    };


    public esStoreAll = async (req: Request, res: Response): Promise<any> => {
        try {
            const request = {
                word: req.body.index,
                body: {
                    section: req.body.section,
                    title: req.body.title,
                    url: req.body.url,
                    date: new Date()
                }
            }
            return this.esDoesIndexExist(request.word)
                .then(doesIt => {
                    if (doesIt) {
                        return this.addSection(request)
                    } else {
                        console.log('create index 655')
                        return this.createESIndex(request.word)
                            .then(() => {
                                return this.addSection(request)


                            })
                            .catch((e: any) => {
                                console.log('gotta problem creating index 661')
                                return e
                                // 'gotta problem creating index 661'

                            })
                    }
                })
                .then(sectionAdded => {
                    if (sectionAdded) {
                        return sectionAdded
                    } else {
                        return 'problem adding doc'
                        console.log('problem adding doc')
                    }
                })
                .catch(e => {
                    console.log('failed to create gotta problem creating doc')
                    return {
                        err: e
                    }
                })
        } catch (e) {
            return e
            console.log('failed to create gotta problem creating doc')
        }
    };

    public esIsURLIndexed = async (website: string): Promise<boolean> => {
        // const website = req.body.website
        const website2 = website.replace(/\\/g, '\\\\')

        const searchRequest = {
            index: '_all',
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    url: website2
                                }
                            },
                            {
                                match: {
                                    rootNode: true
                                }
                            }
                        ]
                    }
                }
            }
        }
        return client
            .search(searchRequest)
            .then((response: any) => {
                if (response && response.hits.total.value === 0) {
                    console.log('url not scrapped')
                    return false
                } else {
                    console.log('url already scrapped')
                    return true
                }
            })
            .catch((e: any) => {
                console.log('error seeing if url exists ' + e)
            })
    };

    public esDoesIndexExist = async (word: string): Promise<any> => {

        try {
            const doesIt = await client.cat.indices({
                index: word,
                format: 'json'
            })
            if (doesIt) {
                return true
            } else {
                return false
            }
        } catch (e) {
            console.log('failed to check if index exists ' + e)
            return false
        }
    };

    private createESIndex = async (word: string): Promise<any> => {

        try {
            const createdIndex = await client.indices.create({
                index: word
            })
            if (createdIndex.acknowledged === true) {
                const mapping = await this.initMapping(word)
                if (mapping) {
                    // let resp = await addDoc(req)
                    return true
                }
            } else {
                console.log('failed to create index')
                return false
            }
        } catch (e) {
            console.log('failed to create index')
            return e
        }
    };

    private initMapping = (indexName: string) => {
        const payload = {
            properties: {
                section: {
                    type: 'text',
                    analyzer: 'standard',
                    fields: {
                        keyword: {
                            type: 'keyword'
                        }
                    }
                },
                title: {
                    type: 'text',
                    fields: {
                        keyword: {
                            type: 'keyword',
                            ignore_above: 256
                        }
                    }
                },
                url: {
                    type: 'text',
                    fields: {
                        raw: {
                            type: 'keyword'
                        }
                    }
                },
                date: {
                    type: 'date',
                    format: 'yyyy-MM-dd'
                },
                leaf: {
                    type: 'boolean'
                }
            }
        }

        return client.indices
            .putMapping({
                index: indexName,
                type: '_doc',
                body: payload
            })
            .then((resp: any) => {
                resp.status(200)
                return resp.json(resp)
            }).then((err: any) => {
                err.status(500)
                return err.json(err)
            })

    };

    private addSection = async (request: any): Promise<any> => {
        try {
            const docAddedResponse = await client.index({
                index: request.word,
                type: '_doc',
                body: request.body
            })
            if (docAddedResponse.result === 'created') {
                console.log('doc inserted ')
                return {
                    result: docAddedResponse,
                    message: 'Doc added'
                }
            } else {
                console.log('eeeeerrr')
                return {
                    error: docAddedResponse
                }
            }
        } catch (e) {
            console.log('failed to insert Section doc ' + e)
            return {
                error: e,
                result: 'failed to insert Section doc'
            }
        }
    };



}