import type { Profile, Typeface } from "@courselit/common-models";
import { checkPermission, FetchBuilder } from "@courselit/utils";
import { UIConstants } from "@courselit/common-models";
import { getProtocol } from "../lib/utils";
const { permissions } = UIConstants;

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formattedLocaleDate = (epochString: Date) =>
    new Date(Number(epochString)).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

export const formulateCourseUrl = (course: any, backend = "") =>
    `${backend}/${course.isBlog ? "post" : "course"}/${course.courseId}/${
        course.slug
    }`;

export const getAddress = (host: string) => {
    return {
        domain: extractDomainFromURL(host),
        backend: host,
        frontend: `http://${host}`,
    };
};

export const getBackendAddress = (
    headers: Record<string, unknown>,
): `${string}://${string}` => {
    return `${getProtocol(
        headers["x-forwarded-proto"] as string | string[] | undefined,
    )}://${headers.host}`;
};

const extractDomainFromURL = (host: string) => {
    return host.split(":")[0];
};

export const canAccessDashboard = (profile: Profile) => {
    return checkPermission(profile.permissions, [
        permissions.manageCourse,
        permissions.manageAnyCourse,
        permissions.manageMedia,
        permissions.manageAnyMedia,
        permissions.manageSite,
        permissions.manageSettings,
        permissions.manageUsers,
        permissions.viewAnyMedia,
    ]);
};

export const constructThumbnailUrlFromFileUrl = (url: string) =>
    url ? url.replace(url.split("/").pop(), "thumb.webp") : null;

export const getPage = async (backend: string, id?: string) => {
    const query = id
        ? `
    query {
        page: getPage(id: "${id}") {
            name,
            layout,
            pageData,
        }
    }
    `
        : `
    query {
        page: getPage {
            name,
            layout,
        }
    }
    `;
    try {
        const fetch = new FetchBuilder()
            .setUrl(`${backend}/api/graph`)
            .setPayload(query)
            .setIsGraphQLEndpoint(true)
            .build();
        const response = await fetch.exec();
        return response.page;
    } catch (e: any) {
        console.log("getPage", e.message); // eslint-disable-line no-console
    }
};

export const isEnrolled = (courseId: string, profile: Profile) =>
    profile.fetched &&
    profile.purchases.some((purchase: any) => purchase.courseId === courseId);

export const isLessonCompleted = ({
    courseId,
    lessonId,
    profile,
}: {
    courseId: string;
    lessonId: string;
    profile: Profile;
}) => {
    const indexOfCurrentCourse = profile.purchases.findIndex(
        (purchase) => purchase.courseId === courseId,
    );
    if (indexOfCurrentCourse === -1) return false;
    return profile.purchases[indexOfCurrentCourse].completedLessons.some(
        (lesson) => lesson === lessonId,
    );
};

export const generateFontString = (typefaces: Typeface[]): string => {
    const fontStringPieces = [];

    for (const typeface of typefaces) {
        if (typeface.typeface !== "Roboto") {
            fontStringPieces.push(
                `family=${typeface.typeface.replace(
                    /\s/g,
                    "+",
                )}:wght@${typeface.fontWeights.join(";")}`,
            );
        }
    }

    const fontString = fontStringPieces.join("&");
    return fontString
        ? `https://fonts.googleapis.com/css2?${fontString}&display=swap`
        : "";
};

const swapMembers = (arr: any[], index1: number, index2: number): any[] => {
    if (index1 < 0 || index1 > arr.length - 1) {
        return arr;
    }
    if (index2 < 0 || index2 > arr.length - 1) {
        return arr;
    }
    [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
    return arr;
};

export const moveMemberUp = (arr: any[], index: number) =>
    swapMembers(arr, index - 1, index);
export const moveMemberDown = (arr: any[], index: number) =>
    swapMembers(arr, index, index + 1);
