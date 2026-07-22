import { AddressCreateRequest, AddressResponse } from "@/models/address/addressResponse"
import { CountryResponse } from "@/models/country/countryResponse"
import { DistrictResponse } from "@/models/district/district"
import countryService from "@/services/country/countryService"
import districtService from "@/services/district/districtService"
import provinceService from "@/services/province/provinceService"
import { useParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { Path, UseFormRegister, UseFormSetValue } from "react-hook-form"
import OptionSelect from "../item/optionSelect"

type Props<T extends AddressCreateRequest> = {
    register: UseFormRegister<T>
    addressInit?: AddressResponse,
    setValue: UseFormSetValue<T>;

}

const AddressForm = <T extends AddressCreateRequest>(
    {
        register,
        addressInit,
        setValue
    }: Props<T>
) => {
    const params = useParams();
    const id = params.id;

    const [countries, setCountries] = useState<CountryResponse[]>([]);
    const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
    const [districts, setDistricts] = useState<DistrictResponse[]>([]);


    useEffect(() => {
        countryService.getCountries()
            .then((res) => {
                setCountries(res)

            })
            .catch(error => {
                console.log(error)
            })
    }, [])


    useEffect(() => {
        if (addressInit) {
            provinceService.getProvinceByCountry(addressInit.countryId)
                .then((res) => {
                    setProvinces(res)
                })
                .catch((error) => {
                    console.log(error)
                })
            districtService.getDistrictByProvince(addressInit.provinceId)
                .then((res) => {
                    setDistricts(res)
                })
                .catch((error) => {
                    console.log(error)
                })
        }
    }, [id])


    const onchangeCountry = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const countryId = parseInt(event.target.value);
        provinceService.getProvinceByCountry(countryId)
            .then((resProvinces) => {
                setProvinces(resProvinces)
            })
    }

    const onchangeProvince = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceId = parseInt(event.target.value);
        districtService.getDistrictByProvince(provinceId)
            .then((resDistricts) => {
                setDistricts(resDistricts);
            })
    }

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                    <OptionSelect<T>
                        fieldName={"countryId" as Path<T>}
                        labelText="Country"
                        placeholder="Select country"
                        defaultValue={addressInit?.countryId}
                        options={countries}
                        register={register}
                        registerOptions={{
                            required: { value: true, message: 'Please select country' },
                            onChange: onchangeCountry,
                        }}
                    />
                </div>

                <div className="col-span-8">
                    <OptionSelect<T>
                        fieldName={"provinceId" as Path<T>}
                        labelText="Province"
                        register={register}
                        options={provinces}
                        placeholder="Select province"
                        defaultValue={addressInit?.provinceId}
                        registerOptions={{
                            required: { value: true, message: 'Please select province' },
                            onChange: onchangeProvince,
                        }}
                    />
                </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                    <OptionSelect<T>
                        fieldName={"districtId" as Path<T>}
                        labelText="District"
                        register={register}
                        options={districts}
                        placeholder="Select district"
                        defaultValue={addressInit?.districtId}
                        registerOptions={{
                            required: { value: true, message: 'Please select district' },
                        }}
                    />
                </div>

                <div className="col-span-7">
                    <input
                        {...register("specificAddress" as Path<T>)}
                        placeholder="Specific address (street, house number...)"
                        className="w-full h-[50px] px-3 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

        </div>
    )







}
export default AddressForm