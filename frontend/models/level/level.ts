
export type Level = {
    id:number,
    name:string,
    description:string,
    status:LevelStatus

}

export enum LevelStatus {
    ACTIVE ="ACTIVE",
    INACTIVE ="INACTIVE"
}