'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export type SelectOption = {
  value: string | number;
  label: string;
};

type Props = {
  label?: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
};

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  disabled,
}: Props) {
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      )}

      <Listbox
        value={value ?? ''}
        onChange={(v) => onChange(v === '' ? undefined : v)}
        disabled={disabled}
      >
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition ${
              disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-700'
            }`}
          >
            <span className="block truncate">{selected ? selected.label : placeholder}</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-xl bg-white border border-gray-100 py-1.5 shadow-lg focus:outline-none text-sm">
              <Listbox.Option
                value=""
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2.5 pl-4 pr-9 ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {placeholder}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                        <CheckIcon className="w-4 h-4" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>

              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2.5 pl-4 pr-9 ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                          <CheckIcon className="w-4 h-4" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}