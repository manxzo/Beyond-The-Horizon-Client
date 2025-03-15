import React from "react";
import { useUser } from "../hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";

const About: React.FC = () => {
  const { user } = useUser();

  return (
    <Container className="py-10">
      <Heading level="h1" className="mb-6">About Beyond The Horizon</Heading>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            Beyond The Horizon is dedicated to connecting individuals seeking support with 
            experienced mentors who can guide them through challenging times. Our platform 
            facilitates meaningful connections, provides resources, and creates a safe space 
            for growth and healing.
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Vision</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            We envision a world where everyone has access to the support they need to overcome 
            obstacles and reach their full potential. Through technology and human connection, 
            we aim to break down barriers to mentorship and create lasting positive change.
          </Text>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Text className="font-semibold">Compassion</Text>
              <Text>We approach every interaction with empathy and understanding.</Text>
            </div>
            <div>
              <Text className="font-semibold">Safety</Text>
              <Text>We prioritize creating secure spaces for vulnerable conversations.</Text>
            </div>
            <div>
              <Text className="font-semibold">Growth</Text>
              <Text>We believe in the capacity for positive change and development.</Text>
            </div>
            <div>
              <Text className="font-semibold">Community</Text>
              <Text>We foster connections that provide strength through shared experiences.</Text>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join Our Community</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="mb-4">
            Whether you're seeking support or looking to become a mentor, Beyond The Horizon 
            welcomes you to our community of growth and healing.
          </Text>
          {!user && (
            <div className="flex gap-4 mt-4">
              <a href="/register" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                Register Now
              </a>
              <a href="/login" className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10">
                Login
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default About; 