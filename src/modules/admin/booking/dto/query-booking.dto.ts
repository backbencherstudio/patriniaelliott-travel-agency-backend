import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryBookingDto {
	@ApiPropertyOptional({ description: 'Free text search' })
	@IsOptional()
	@IsString()
	q?: string;

	@ApiPropertyOptional({ description: 'Booking status filter' })
	@IsOptional()
	@IsString()
	status?: number;

	@ApiPropertyOptional({ description: 'Approval status filter' })
	@IsOptional()
	@IsString()
	approve?: string;

	@ApiPropertyOptional({ description: 'Booking type', enum: ['all', 'hotel', 'apartment', 'tour'] })
	@IsOptional()
	@IsIn(['all', 'hotel', 'apartment', 'tour'])
	type?: 'all' | 'hotel' | 'apartment' | 'tour';

	@ApiPropertyOptional({ description: 'Date range filter', enum: ['last_30_days', 'last_7_days', 'last_90_days', 'all'] })
	@IsOptional()
	@IsIn(['last_30_days', 'last_7_days', 'last_90_days', 'all'])
	date_range?: 'last_30_days' | 'last_7_days' | 'last_90_days' | 'all';

	@ApiPropertyOptional({ description: 'Page number', default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ description: 'Items per page', default: 10 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit?: number = 10;

	@ApiPropertyOptional({ 
		description: 'Sort option', 
		enum: ['created_at_asc', 'created_at_desc', 'total_amount_asc', 'total_amount_desc', 'booking_id_asc', 'booking_id_desc', 'name_asc', 'name_desc'],
		default: 'created_at_desc' 
	})
	@IsOptional()
	@IsIn(['created_at_asc', 'created_at_desc', 'total_amount_asc', 'total_amount_desc', 'booking_id_asc', 'booking_id_desc', 'name_asc', 'name_desc'])
	sort_by?: 'created_at_asc' | 'created_at_desc' | 'total_amount_asc' | 'total_amount_desc' | 'booking_id_asc' | 'booking_id_desc' | 'name_asc' | 'name_desc' = 'created_at_desc';
}


