import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LikeRepository {
  /**
   * Update like count
   * @returns
   */
  static async updateLikeCount(likeable_id: string, likeable_type: string) {
    const upvoteCount = await prisma.like.count({
      where: {
        likeable_id,
        likeable_type,
      },
    });

    await prisma.blog.update({
      where: {
        id: likeable_id,
      },
      data: {
        like_count: upvoteCount,
      },
    });
  }
}
