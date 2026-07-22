type Props = {
  pageIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function Pagination({
  pageIndex,
  totalPages,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex justify-between items-center">
      <button
        disabled={pageIndex === 0}
        onClick={onPrev}
        className="px-4 py-2 border rounded-xl disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm text-gray-600">
        Page {pageIndex + 1} / {totalPages}
      </span>

      <button
        disabled={pageIndex + 1 >= totalPages}
        onClick={onNext}
        className="px-4 py-2 border rounded-xl disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}