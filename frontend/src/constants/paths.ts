/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export enum Play {
  SEARCH = 'search',
  CLASSIFY = 'classify',
  GENERATE = 'generate'

}
export enum PathParameterKey {
  INDEX_ID = 'index_id'
}

export interface PathParameter {
  [PathParameterKey.INDEX_ID]: string
}
