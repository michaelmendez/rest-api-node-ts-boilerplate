export const mustContain = (index: string, text: string) => {
  console.log(index + text);
  if (text) {
    return {
      index,
      body: {
        query: {
          bool: {
            must: {
              query_string: {
                query: text,
              },
            },
          },
        },
      },
    };
  } else {
    return {
      index,
    };
  }
};

// https://www.elastic.co/guide/en/elasticsearch/reference/6.8/full-text-queries.html

export const typeaheadQuery = (index: string, text: string) => {
  console.log(index + text);
  return {
    index,
    body: {
      query: {
        match_phrase_prefix: {
          question: text,
        },
      },
    },
  };
};
