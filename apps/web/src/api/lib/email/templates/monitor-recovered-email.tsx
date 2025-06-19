import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface MonitorRecoveredEmailProps {
  monitorName: string;
  url: string;
  userName?: string;
  downtime?: string;
  lastChecked: string;
  region?: string;
  dashboardUrl?: string;
}

export const MonitorRecoveredEmail = ({
  monitorName = "Your Monitor",
  url = "https://example.com",
  userName = "there",
  downtime,
  lastChecked = new Date().toISOString(),
  region,
  dashboardUrl = "https://shamva.io/dashboard",
}: MonitorRecoveredEmailProps) => {
  const previewText = `${monitorName} is back online`;
  const formattedDate = new Date(lastChecked).toLocaleString();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </Section>

            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Great News: <strong>{monitorName}</strong> is Back Online
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userName},
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Your monitor <strong>{monitorName}</strong> has recovered and is
              now responding normally.
            </Text>

            <Section className="bg-green-50 rounded-lg p-4 my-4">
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>URL:</strong> {url}
              </Text>
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>Status:</strong> Online
              </Text>
              {downtime && (
                <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                  <strong>Downtime:</strong> {downtime}
                </Text>
              )}
              <Text className="text-black text-[14px] leading-[24px] m-0 mb-2">
                <strong>Recovered At:</strong> {formattedDate}
              </Text>
              {region && (
                <Text className="text-black text-[14px] leading-[24px] m-0">
                  <strong>Region:</strong> {region}
                </Text>
              )}
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              We'll continue monitoring to ensure your service stays healthy.
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3 inline-block"
                href={dashboardUrl}
              >
                View Dashboard
              </Link>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Best regards,
              <br />
              The Shamva Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
