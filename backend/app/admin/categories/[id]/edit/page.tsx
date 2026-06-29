import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/categories/category-form";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category || category.isDeleted) {
    notFound();
  }

  const initialData = {
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    isActive: category.isActive,
  };

  return (
    <div className="space-y-6">
      <CategoryForm initialData={initialData} />
    </div>
  );
}
