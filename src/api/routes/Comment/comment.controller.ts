import { Request, Response } from "express";

import { client } from "../../elasticsearch";

export async function addAnswer(req: Request, res: Response) {
  return client
    .index({
      index: "answer",
      // id: '1',
      type: "_doc",
      body: {
        questionId: req.params.id,
        // tslint:disable-next-line: no-string-literal
        from: req["payload"].userId,
        answer: req.body.answer,
        likes: [],
        commentIds: [],
      },
    })
    .then(async (resp) => {
      res.json(resp);
      const answerIds = [...req.body.answerIds, resp._id];
      console.log(answerIds);
      await client.update({
        index: "question",
        type: "_doc",
        id: req.params.id,
        body: {
          doc: {
            // put the partial document under the `doc` key
            answerIds,
          },
        },
      });
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message)
    });
}

export async function getAnswer(req: Request, res: Response) {
  console.log(req.query.index);
  const text = req.params.text;
  return client
    .get({
      index: "answer",
      type: "_doc",
      id: req.params.answerId,
    })
    .then(async (resp) => {
      res.json(resp);
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message)
    });
}



export async function addLike(req: Request, res: Response) {
    const likes = req.body.likes
    return client
    .update({
      index: "answer",
      id: req.params.answerId,
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

export async function getComment(req: Request, res: Response) {
    const text = req.params.text;
    return client
      .get({
        index: "comment",
        type: "_doc",
        id: req.params.commentId,
      })
      .then(async (resp) => {
        res.json(resp);
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message)
      });
  }


  export async function addComment(req: Request, res: Response) {
    return client
      .index({
        index: "comment",
        // id: '1',
        type: "_doc",
        body: {
          parentId: req.params.id,
          // tslint:disable-next-line: no-string-literal
          authorId: req["payload"].userId,
          comment: req.body.text,
          likes: [],
          commentIds: [],
        },
      })
      .then(async (resp) => {
        res.json(resp);
        const commentIds = [...req.body.commentIds, resp._id];
        console.log(commentIds);
        await client.update({
          index: req.params.index,
          type: "_doc",
          id: req.params.id,
          body: {
            doc: {
              // put the partial document under the `doc` key
              commentIds,
            },
          },
        });
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message)
      });
  }

  
export async function addCommentLike(req: Request, res: Response) {
    const likes = req.body.likes
    return client
    .update({
      index: "comment",
      id: req.params.commentId,
      type: "_doc",
      body: {
        doc: {
            // tslint:disable-next-line: no-string-literal
            likes: [...likes],
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