import { FaAngleDown } from 'react-icons/fa';

const SecondLink = [
    {
        id: 1,
        name: "Development and It",
        link: "/cat/dev-it"
    },
    {
        id: 2,
        name: "Design & Creative",
        link: "/cat/design-creative"
    },
    {
        id: 3,
        name: "Sales & Marketing",
        link: "/cat/sales-marketing"
    },
    {
        id: 4,
        name: "Writing & Translation",
        link: "/cat/writing-translation"
    },
    {
        id: 5,
        name: "Admin & Custom Support",
        link: "/cat/admin-customer-support"
    },
];

const MoreLink = [
    {
        id: 1,
        name: "More",
        icon: <FaAngleDown/>,
        subLink: [
            {
                id: 1,
                name: "Automation Dashboard",
                link: "/automation",
            },
            {
                id: 2,
                name: "Community",
                link: "/community"
            },
            {
                id: 3,
                name: "Mentorship",
                link: "/mentorship"
            }
        ]
    }
];

export default SecondLink;
export { MoreLink };
