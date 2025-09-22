import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class WithdrawDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number

    @IsNotEmpty()
    @IsString()
    method: string
}
