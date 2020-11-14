import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
@Entity({name: 'game_role'})
export class GameRole extends BaseEntity {
    @PrimaryColumn()
    name: string;
    
    @Column()
    uid: string

    @Column()
    account: string;

    @Column()
    serverid: string;

    @Column()
    x: number;

    @Column()
    y: number;

    @Column()
    z: number;

    @Column()
    rolemodel: Buffer;

    @Column()
    roledata: Buffer;

    @Column()
    createtime: number;

    @Column()
    deltime: number;
}