export type SupplierInput={supplierCode:string;name:string;contactPerson?:string;phone?:string;email?:string;address?:string;notes?:string;status?:'active'|'inactive'};
export type SupplierQuery={search?:string;status?:string;limit?:number};
