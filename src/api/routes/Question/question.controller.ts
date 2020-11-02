import { Request, Response } from "express";

import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";

export async function getTypeAhead(req: Request, res: Response) {
    console.log(req.query.index);
    const text = req.params.text
    return client
      .search(typeaheadQuery('question', text))
      .then((resp) => {
        res.json(
          resp.hits.hits,
        );
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message)
      });
}


export async function addQuestion(req: Request, res: Response) {
  console.log(req.params.question);
  return client
    .index({
      index: 'question',
      type: "_doc",
      body: {
        question: req.params.question,
        authorId: req["payload"].userId,
        likes: [],
        commentIds: []
      },
    })
    .then((resp) => {
      console.log("Successful query!");
      res.json({
        response: 'success',
      });
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message)
    });
}

export async function getAllPaginated(req: Request, res: Response) {
  return client
    .search({
      from: req.query.from,
      size: 10,
      index: 'question',
    })
    
    .then((resp) => {
      console.log("Successful query!");
      res.json(
        resp.hits,
      );
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message)
    });
}

export async function addQuestionLike(req: Request, res: Response) {
  const likes = req.body.likes
  console.log(req["payload"].userId)
  return client
  .update({
    index: "question",
    id: req.params.questionId,
    type: "_doc",
    body: {
      doc: {
          // tslint:disable-next-line: no-string-literal
          likes: [...likes, req["payload"].userId],
        }
    }
  })
  .then(async (resp) => {
    res.json(resp);
  })
  .catch((err) => {
    console.trace(err.message);
    res.status(400).send(err.message)
  });
}