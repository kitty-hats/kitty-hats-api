declare module "*";

declare module "*.json" {
    const value: any;
    export default value;
}

declare module require {}