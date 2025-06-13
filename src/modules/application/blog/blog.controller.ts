import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @ApiOperation({ summary: 'Get all blogs' })
  @Get()
  async findAll(@Query() query: { q?: string; status?: number }) {
    try {
      const searchQuery = query.q;
      const status = query.status;

      const blogs = await this.blogService.findAll({
        q: searchQuery,
        status: status,
      });
      return blogs;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Search blogs' })
  @Get('search')
  async search(@Query('q') q: string) {
    try {
      const blogs = await this.blogService.search(q);
      return blogs;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get a blog by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const blog = await this.blogService.findOne(id);
      return blog;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Like a blog' })
  @Post(':id/like')
  async like(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const result = await this.blogService.react(user_id, id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Comment on a blog' })
  @Post(':id/comment')
  async comment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() commentDto: CreateCommentDto,
  ) {
    try {
      const user_id = req.user.userId;
      const result = await this.blogService.comment(user_id, id, commentDto);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @Delete(':id/comment/:comment_id')
  async deleteComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('comment_id') comment_id: string,
  ) {
    try {
      const user_id = req.user.userId;
      const result = await this.blogService.deleteComment(user_id, comment_id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
