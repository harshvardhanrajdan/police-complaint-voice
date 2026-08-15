import type { ComplaintInput } from "./types";

export type SampleCase = {
  id: string;
  label: string;
  description: string;
  data: ComplaintInput;
};

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "upi-fraud",
    label: "UPI / online fraud",
    description: "OTP scam — money transferred",
    data: {
      complainantName: "Rahul Sharma",
      complainantPhone: "9876543210",
      complainantAddress: "Flat 12-B, Sector 18, Noida, Uttar Pradesh",
      parentage: "S/o Ramesh Sharma",
      age: "29",
      gender: "Male",
      occurrenceDate: "2026-03-10",
      occurrenceTime: "14:30",
      occurrencePlace: "Noida, Uttar Pradesh (online / phone)",
      policeStation: "Sector 20 Police Station",
      policeStationDistrict: "Gautam Buddha Nagar",
      policeStationState: "Uttar Pradesh",
      policeStationPhone: "0120-2511000",
      accused: "Unknown person calling as bank officer; UPI ID unknown",
      witnesses: "None",
      injuryOrLoss: "₹45,000 transferred via UPI",
      reliefSought: "Register FIR, investigate, freeze/recover amount if possible",
      language: "en",
      verbatimAccount:
        "Yesterday afternoon someone called me saying they are from my bank fraud department. They said my account will be blocked and asked me to share the OTP that came on my phone. I shared the OTP. Then from my PhonePe I saw ₹45,000 went to some unknown UPI. I did not authorise this transfer. I want the police to take action on this online UPI fraud.",
    },
  },
  {
    id: "theft",
    label: "Mobile theft",
    description: "Phone stolen in market",
    data: {
      complainantName: "Priya Verma",
      complainantPhone: "9123456780",
      complainantAddress: "45 MG Road, Indore, Madhya Pradesh",
      parentage: "D/o Suresh Verma",
      age: "24",
      gender: "Female",
      occurrenceDate: "2026-03-12",
      occurrenceTime: "18:15",
      occurrencePlace: "Rajwada market, Indore",
      policeStation: "Sarafa / Rajwada Police Station",
      policeStationDistrict: "Indore",
      policeStationState: "Madhya Pradesh",
      policeStationPhone: "0731-2531111",
      accused: "Unknown — young man in black hoodie",
      witnesses: "Shopkeeper nearby may have seen",
      injuryOrLoss: "iPhone 13, black, IMEI will be provided",
      reliefSought: "Register complaint, recover phone, CCTV check",
      language: "en",
      verbatimAccount:
        "I was standing near the fruit shop in Rajwada market. A boy in a black hoodie came from behind and stole my mobile phone from my hand and ran towards the main road. I shouted but he escaped in the crowd. My phone is iPhone 13 black colour. I want police help to catch him and get my phone back.",
    },
  },
  {
    id: "threat-hi",
    label: "Threat (Hinglish)",
    description: "Neighbour threat — mixed language",
    data: {
      complainantName: "Amit Kumar",
      complainantPhone: "9988776655",
      complainantAddress: "Lane 3, Patel Nagar, Delhi",
      parentage: "S/o Vijay Kumar",
      age: "35",
      gender: "Male",
      occurrenceDate: "2026-03-11",
      occurrenceTime: "21:00",
      occurrencePlace: "Outside my house, Patel Nagar, Delhi",
      policeStation: "Patel Nagar Police Station",
      policeStationDistrict: "Central Delhi",
      policeStationState: "Delhi",
      policeStationPhone: "011-25841100",
      accused: "Rakesh, neighbour, first floor",
      witnesses: "My wife Sunita",
      injuryOrLoss: "No physical injury yet; fear for safety",
      reliefSought: "Action against threat, ensure safety",
      language: "hi",
      verbatimAccount:
        "Kal raat lagbhag 9 baje mere padosi Rakesh ne mere ghar ke bahar aake mujhe dhamki di. Usne kaha ki agar main society meeting me uske against bola to woh mujhe dekh lega aur meri family ko bhi nuksaan pahunchayega. Meri wife Sunita bhi sun rahi thi. Mujhe bahut darr lag raha hai. Main police complaint karna chahta hoon.",
    },
  },
];
