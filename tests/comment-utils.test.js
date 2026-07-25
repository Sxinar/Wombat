import test from 'node:test';
import assert from 'node:assert/strict';
import { getCommentId } from '../src/lib/comment-utils.js';

test('prefers Mongo _id over legacy id', () => {
  assert.equal(getCommentId({ _id: 'mongo-id', id: 'legacy-id' }), 'mongo-id');
});

test('falls back to id when _id is missing', () => {
  assert.equal(getCommentId({ id: 'legacy-id' }), 'legacy-id');
});
