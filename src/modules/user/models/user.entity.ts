import { BaseEntity, PrimaryGeneratedColumn, Column, Entity } from 'typeorm';
@Entity({name: 'account'})
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    account: string;
    
    @Column()
    email: string;

    @Column()
    psw: string;

    @Column()
    gmlevel: string;

    @Column()
    adult: number;

    @Column()
    purse: number;

    @Column()
    time: number;

    @Column()
    forgot_token: string;

    @Column()
    verify_token: string;

    @Column()
    access_token: string;

    @Column()
    verified: boolean;

    @Column()
    state: number;
}