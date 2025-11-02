import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
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
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		// Handle array (duplicate query params) - use the last value
		const actualValue = Array.isArray(value) ? value[value.length - 1] : value;
		const validValues = ['all', 'hotel', 'apartment', 'tour'];
		return validValues.includes(actualValue) ? actualValue : undefined;
	})
	@IsIn(['all', 'hotel', 'apartment', 'tour'])
	type?: 'all' | 'hotel' | 'apartment' | 'tour';

	@ApiPropertyOptional({ description: 'Date range filter', enum: ['last_30_days', 'last_7_days', 'last_90_days', 'all'] })
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const validValues = ['last_30_days', 'last_7_days', 'last_90_days', 'all'];
		return validValues.includes(value) ? value : undefined;
	})
	@IsIn(['last_30_days', 'last_7_days', 'last_90_days', 'all'])
	date_range?: 'last_30_days' | 'last_7_days' | 'last_90_days' | 'all';

	@ApiPropertyOptional({ description: 'Page number', default: 1 })
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const num = Number(value);
		return isNaN(num) || num < 1 ? undefined : num;
	})
	@IsNumber()
	@Min(1)
	page?: number;
	
	@ApiPropertyOptional({ description: 'Date filter', enum: ['30days', '15days', '7days', 'all'] })
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const validValues = ['30days', '15days', '7days', 'all'];
		return validValues.includes(value) ? value : undefined;
	})
	@IsIn(['30days', '15days', '7days', 'all'])
	dateFilter?: '30days' | '15days' | '7days' | 'all';

	@ApiPropertyOptional({ description: 'Items per page', default: 10 })
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const num = Number(value);
		return isNaN(num) || num < 1 ? undefined : num;
	})
	@IsNumber()
	@Min(1)
	limit?: number;

	@ApiPropertyOptional({ 
		description: 'Sort option', 
		enum: ['created_at_asc', 'created_at_desc', 'total_amount_asc', 'total_amount_desc', 'booking_id_asc', 'booking_id_desc', 'name_asc', 'name_desc'],
		default: 'created_at_desc' 
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const validValues = ['created_at_asc', 'created_at_desc', 'total_amount_asc', 'total_amount_desc', 'booking_id_asc', 'booking_id_desc', 'name_asc', 'name_desc'];
		return validValues.includes(value) ? value : undefined;
	})
	@IsIn(['created_at_asc', 'created_at_desc', 'total_amount_asc', 'total_amount_desc', 'booking_id_asc', 'booking_id_desc', 'name_asc', 'name_desc'])
	sort_by?: 'created_at_asc' | 'created_at_desc' | 'total_amount_asc' | 'total_amount_desc' | 'booking_id_asc' | 'booking_id_desc' | 'name_asc' | 'name_desc';
}


