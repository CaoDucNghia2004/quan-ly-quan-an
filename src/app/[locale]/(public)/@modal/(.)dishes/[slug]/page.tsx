import dishApiRequest from "@/apiRequests/dish";
import { getIdFromSlugUrl, wrapServerApi } from "@/lib/utils";
// import Modal from "@/app/(public)/@modal/(.)dishes/[id]/modal";

import DishDetail from "@/app/[locale]/(public)/dishes/[slug]/dish-detail";
import Modal from "./modal";

export default async function DishPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const id = getIdFromSlugUrl(slug);
    const data = await wrapServerApi(() => dishApiRequest.getDish(Number(id)));

    const dish = data?.payload?.data;
    return (
        <Modal>
            <DishDetail dish={dish} />
        </Modal>
    );
}
