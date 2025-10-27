import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOrderHistory from '@/models/UserOrderHistory';

export async function POST() {
  try {
    await dbConnect();

    const sampleData = [
      { userId: "U863ec6850ff494c8ad50b25afa94efb0", userName: "21gun", shopName: "Rare", payMethod: "เครดิต" },
      { userId: "U863ec6850ff494c8ad50b25afa94efb0", userName: "21gun", shopName: "8 Dining", payMethod: "เครดิต" },
      { userId: "U863ec6850ff494c8ad50b25afa94efb0", userName: "21gun", shopName: "Morning Tonight", payMethod: "เครดิต" },
      { userId: "Ua3053965758d74c5d89f517726b61c9b", userName: "Biew🦊", shopName: "Daya Eatery", payMethod: "เงินสด" },
      { userId: "Ubf8c86a0990a02f0fa6720a3ced1723e", userName: "𝑪𝒉𝒂𝒍𝒊𝒏𝒆𝒆 𝑺.", shopName: "Den shabu", payMethod: "เงินสด" },
      { userId: "Ua560acbf9a31e34c0b4e4c64e77ac84d", userName: "donutdunkin", shopName: "Nailed It Downtown", payMethod: "โอนเงิน" },
      { userId: "U959d6700542421cd79380a4908afe3d6", userName: "Dream", shopName: "เชิญ ปลาจุ่ม", payMethod: "โอนเงิน" },
      { userId: "U38cf79a0245305294a59833353cea1ae", userName: "Dripping Hill", shopName: "Dripping Hill", payMethod: "โอนเงิน" },
      { userId: "U47192b44328ccd19d577180bf4f122c5", userName: "FTK", shopName: "NOCT bistro", payMethod: "โอนเงิน" },
      { userId: "Uc6055f977b197597baf773d364ef63ef", userName: "Gt", shopName: "ไวท์เฮ้าส์", payMethod: "เงินสด" },
      { userId: "Ub25b4a42fcc8758cb1a211f1f480c6e3", userName: "Gulf Fy🐈🖤⚽️🎮", shopName: "Den Shabu", payMethod: "เงินสด" },
      { userId: "U7ff136fcdfa42488e6a7badc601c3857", userName: "ion", shopName: "ความสุข", payMethod: "เงินสด" },
      { userId: "U0e980777e178950d5640753c3942f1ce", userName: "Iwaynew Wongsuwat", shopName: "เรื่องของสเต๊ก", payMethod: "โอนเงิน" },
      { userId: "U4b32d3476814e939fa1d5efbeb8f9470", userName: "Living n' Cooking", shopName: "Living&Cooking", payMethod: "โอนเงิน" },
      { userId: "U0d6b72543464859ef62065c9501370cd", userName: "Moo_Mhee154🪐🧧46 🍞🥚🍒", shopName: "Ginda wagyu", payMethod: "โอนเงิน" },
      { userId: "U0a6caa79590587d5269bfdd7dcb6f3c2", userName: "namm", shopName: "Homie", payMethod: "โอนเงิน" },
      { userId: "U3cb7c7018c06e87beab55320f27f7317", userName: "Ning🍒", shopName: "Touch Steak", payMethod: "โอนเงิน" },
      { userId: "Uf31fcbb445a04ac9cfb8fb58a37d2724", userName: "Nöei", shopName: "Pepper International", payMethod: "เงินสด" },
      { userId: "Uc0f3910d135521f0995ac379d0c945f8", userName: "NXTJIRA☘️", shopName: "Fat Boy", payMethod: "เครดิต" },
      { userId: "Uc0f3910d135521f0995ac379d0c945f8", userName: "NXTJIRA☘️", shopName: "8 Bistro", payMethod: "เครดิต" },
      { userId: "Uc0f3910d135521f0995ac379d0c945f8", userName: "NXTJIRA☘️", shopName: "Shounen Yakiniku", payMethod: "เครดิต" },
      { userId: "Uc0f3910d135521f0995ac379d0c945f8", userName: "NXTJIRA☘️", shopName: "Ken Izakaya", payMethod: "เครดิต" },
      { userId: "U21b3788b2e55446c56765eb78ef5a3ab", userName: "PIN🐰", shopName: "บ้านอิ่มอร่อย", payMethod: "เงินสด" },
      { userId: "U0e10de2b5352d65f5e41d2b3856f6ca3", userName: "Pong", shopName: "Bosco", payMethod: "เงินสด" },
      { userId: "Ucb38ad2dcc4eb6132ff13102caeb451d", userName: "pookkee🐰", shopName: "HIP COFFEE", payMethod: "เงินสด" },
      { userId: "U7711f10ffcab56530d678ac3eace826f", userName: "Prin Isarangkool", shopName: "Brotherly", payMethod: "โอนเงิน" },
      { userId: "Ud8a5b523e15a5b7f3a9ea4ea805a2144", userName: "Yew", shopName: "Daya's eatery", payMethod: "เงินสด" },
      { userId: "U48aa85b4df64a5fbfd7e3c13fc491cc2", userName: "ชัชนภา ล ❤️17-01", shopName: "Sugar Beam", payMethod: "โอนเงิน" },
      { userId: "Ub61ffc31749c91e81bdbf2f37821bf49", userName: "ร้าน คริสตัลคาเฟ่", shopName: "คริสตัลคาเฟ่", payMethod: "เงินสด" },
      { userId: "U10d1335562fd1e1aa4aa1ab5a386021c", userName: "ร้านอาหารบ้านคุณย่า", shopName: "ขนมบ้านคุณย่า", payMethod: "เงินสด" },
      { userId: "U78617910c23af5dc02e8b5d4035a5026", userName: "ใหญ่", shopName: "ฌาณิ", payMethod: "โอนเงิน" },
      { userId: "Ue9f62e55fc32174e8327fb35dba05a3d", userName: "อัน อัน ธัญญรัศม์", shopName: "บ้านเราสเต็กเฮ้าส์", payMethod: "โอนเงิน" },
      { userId: "U2cbea13fe96f2bbcbdd4a690f0ad2d65", userName: "SnOff x MTFK", shopName: "Again Please Cafe", payMethod: "โอนเงิน" }
    ];

    // Group by userId
    const groupedData = {};
    sampleData.forEach(item => {
      if (!groupedData[item.userId]) {
        groupedData[item.userId] = {
          userId: item.userId,
          shops: []
        };
      }
      groupedData[item.userId].shops.push({
        shopName: item.shopName,
        payMethod: item.payMethod,
        userName: item.userName
      });
    });

    // Clear existing data
    await UserOrderHistory.deleteMany({});

    // Insert grouped data
    const insertPromises = Object.values(groupedData).map(userData =>
      UserOrderHistory.create(userData)
    );

    const results = await Promise.all(insertPromises);

    return NextResponse.json({
      success: true,
      message: `Inserted ${results.length} user records with ${sampleData.length} total shop entries`,
      insertedUsers: results.length,
      totalShops: sampleData.length
    });

  } catch (error) {
    console.error('Seed data insertion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}