const { filterApprovedCommentsForPublic } = require('../src/data/comments');

describe('comments data public filtering', () => {
  test('does not expose unapproved replies through approved parent comments', () => {
    const comments = [
      {
        id: 'approved-parent',
        postSlug: 'nota',
        author: 'A',
        email: 'a@example.com',
        content: 'visible',
        createdAt: '2026-01-01T00:00:00.000Z',
        isApproved: true,
        replies: [
          {
            id: 'approved-reply',
            postSlug: 'nota',
            author: 'B',
            email: 'b@example.com',
            content: 'visible reply',
            createdAt: '2026-01-01T00:00:00.000Z',
            isApproved: true,
          },
          {
            id: 'pending-reply',
            postSlug: 'nota',
            author: 'C',
            email: 'c@example.com',
            content: 'pending reply',
            createdAt: '2026-01-01T00:00:00.000Z',
            isApproved: false,
          },
        ],
      },
      {
        id: 'pending-parent',
        postSlug: 'nota',
        author: 'D',
        email: 'd@example.com',
        content: 'pending parent',
        createdAt: '2026-01-01T00:00:00.000Z',
        isApproved: false,
      },
    ];

    const publicComments = filterApprovedCommentsForPublic(comments);

    expect(publicComments).toEqual([
      expect.objectContaining({
        id: 'approved-parent',
        replies: [expect.objectContaining({ id: 'approved-reply' })],
      }),
    ]);
    expect(JSON.stringify(publicComments)).not.toContain('email');
    expect(JSON.stringify(publicComments)).not.toContain('pending-reply');
  });
});
