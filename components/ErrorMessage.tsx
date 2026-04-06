export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <div className="text-4xl">⚠️</div>
      <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">{message}</p>
    </div>
  );
}
