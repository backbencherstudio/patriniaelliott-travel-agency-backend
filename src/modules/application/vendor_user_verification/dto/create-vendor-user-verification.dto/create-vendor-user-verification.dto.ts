import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// DTO for User Document
export class UserDocumentDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  file_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  file_path?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}


