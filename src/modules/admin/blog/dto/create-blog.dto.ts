import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Blog title',
    example: 'Family Package',
  })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Blog description, summary of the blog',
  })
  description?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Blog body, full content of the blog',
  })
  body?: string;
}
