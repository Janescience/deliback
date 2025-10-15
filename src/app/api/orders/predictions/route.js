import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';
import Holiday from '@/models/Holiday';

export async function GET(request) {
  try {
    await dbConnect();

    // Find the next working day (skip holidays)
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); // Start with tomorrow

    let daysChecked = 0;
    const maxDaysToCheck = 7; // Don't check more than a week ahead

    while (daysChecked < maxDaysToCheck) {
      const targetDayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

      // Check if this day is a holiday
      const holidayConfig = await Holiday.findOne({ day_of_week: targetDayOfWeek });
      const isHoliday = holidayConfig?.is_holiday || false;

      if (!isHoliday) {
        // Found a working day
        break;
      }

      // Skip to next day
      targetDate.setDate(targetDate.getDate() + 1);
      daysChecked++;
    }

    const targetDayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to MongoDB dayOfWeek (1=Sunday, 2=Monday, ..., 7=Saturday)
    const mongoTargetDay = targetDayOfWeek === 0 ? 1 : targetDayOfWeek + 1;

                daysChecked > 0 ? `(skipped ${daysChecked} holiday(s))` : '');

    // Step 1: Analyze customer ordering patterns to find high-probability customers
    const customerOrderingPatterns = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null },
          delivery_date: { $exists: true }
        }
      },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$delivery_date' },
          deliveryDateStr: { $dateToString: { format: "%Y-%m-%d", date: '$delivery_date' } }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $group: {
          _id: '$customer_id',
          customerName: { $first: '$customer.name' },
          allOrderDates: { $push: '$deliveryDateStr' },
          sameDayOrders: {
            $sum: {
              $cond: [{ $eq: ['$dayOfWeek', mongoTargetDay] }, 1, 0]
            }
          },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: '$delivery_date' },
          ordersByDay: {
            $push: {
              date: '$delivery_date',
              dayOfWeek: '$dayOfWeek'
            }
          }
        }
      },
      {
        $addFields: {
          // Calculate ordering cycle (average days between orders)
          uniqueOrderDates: { $setUnion: ['$allOrderDates', []] },
          dayOfWeekFrequency: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $divide: ['$sameDayOrders', '$totalOrders'] },
              0
            ]
          },
          daysSinceLastOrder: {
            $divide: [
              { $subtract: [new Date(), '$lastOrderDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $addFields: {
          orderingCycleDays: {
            $cond: [
              { $gt: [{ $size: '$uniqueOrderDates' }, 1] },
              {
                $divide: [
                  {
                    $divide: [
                      { $subtract: ['$lastOrderDate', { $min: '$ordersByDay.date' }] },
                      1000 * 60 * 60 * 24
                    ]
                  },
                  { $subtract: [{ $size: '$uniqueOrderDates' }, 1] }
                ]
              },
              7 // Default to weekly if insufficient data
            ]
          }
        }
      },
      {
        $addFields: {
          // High probability if:
          // 1. Frequently orders on this day of week (>15%)
          // 2. Within ordering cycle (+/- 2 days)
          // 3. Recent activity (within last 14 days)
          cycleMatch: {
            $and: [
              { $gte: ['$daysSinceLastOrder', { $subtract: ['$orderingCycleDays', 2] }] },
              { $lte: ['$daysSinceLastOrder', { $add: ['$orderingCycleDays', 2] }] }
            ]
          },
          recentActivity: { $lte: ['$daysSinceLastOrder', 14] },
          orderProbability: {
            $multiply: [
              '$dayOfWeekFrequency',
              {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$daysSinceLastOrder', { $subtract: ['$orderingCycleDays', 2] }] },
                      { $lte: ['$daysSinceLastOrder', { $add: ['$orderingCycleDays', 2] }] }
                    ]
                  },
                  2.0, // Double score if within ordering cycle
                  {
                    $cond: [
                      { $lte: ['$daysSinceLastOrder', 7] }, // Very recent
                      1.5,
                      {
                        $cond: [
                          { $lte: ['$daysSinceLastOrder', 14] }, // Recent
                          1.2,
                          0.5 // Old orders get lower score
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                $cond: [
                  { $gte: ['$totalOrders', 5] }, // Established customers get bonus
                  1.2,
                  1.0
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          orderProbability: { $gte: 0.15 }, // At least 15% probability
          sameDayOrders: { $gte: 2 }, // At least 2 historical orders on this day
          totalOrders: { $gte: 5 } // At least 5 total orders (established customer)
        }
      },
      {
        $sort: { orderProbability: -1 }
      },
      {
        $limit: 8 // Top 8 most likely customers
      }
    ]);

    // Step 2: For high-probability customers, get their vegetable preferences
    const highProbabilityCustomerIds = customerOrderingPatterns.map(c => c._id);

    let customerPredictions = [];

    if (highProbabilityCustomerIds.length > 0) {
      customerPredictions = await Order.aggregate([
        {
          $match: {
            customer_id: { $in: highProbabilityCustomerIds },
            delivery_date: { $exists: true }
          }
        },
        {
          $addFields: {
            dayOfWeek: { $dayOfWeek: '$delivery_date' }
          }
        },
        {
          $lookup: {
            from: 'orderdetails',
            localField: '_id',
            foreignField: 'order_id',
            as: 'orderDetails'
          }
        },
        {
          $unwind: '$orderDetails'
        },
        {
          $lookup: {
            from: 'vegetables',
            localField: 'orderDetails.vegetable_id',
            foreignField: '_id',
            as: 'vegetable'
          }
        },
        {
          $unwind: '$vegetable'
        },
        {
          $group: {
            _id: {
              customer_id: '$customer_id',
              vegetable_id: '$orderDetails.vegetable_id'
            },
            vegetableName: { $first: '$vegetable.name_th' },
            vegetablePrice: { $first: '$vegetable.price' },
            sameDayOrders: {
              $sum: {
                $cond: [{ $eq: ['$dayOfWeek', mongoTargetDay] }, 1, 0]
              }
            },
            sameDayAvgQuantity: {
              $avg: {
                $cond: [
                  { $eq: ['$dayOfWeek', mongoTargetDay] },
                  '$orderDetails.quantity',
                  null
                ]
              }
            },
            totalOrders: { $sum: 1 },
            avgQuantity: { $avg: '$orderDetails.quantity' },
            lastOrderDate: { $max: '$delivery_date' }
          }
        },
        {
          $match: {
            $or: [
              { sameDayOrders: { $gte: 1 } }, // Ordered on this day before
              { totalOrders: { $gte: 3 } } // Or frequently ordered overall
            ]
          }
        },
        {
          $addFields: {
            vegetableProbability: {
              $cond: [
                { $gt: ['$sameDayOrders', 0] },
                { $divide: ['$sameDayOrders', '$totalOrders'] },
                { $multiply: [{ $divide: ['$totalOrders', 10] }, 0.3] } // Lower probability for new vegetables
              ]
            },
            predictedQuantity: {
              $let: {
                vars: {
                  rawQuantity: {
                    $cond: [
                      { $gt: ['$sameDayAvgQuantity', 0] },
                      '$sameDayAvgQuantity',
                      '$avgQuantity'
                    ]
                  }
                },
                in: {
                  $divide: [
                    { $ceil: { $multiply: ['$$rawQuantity', 2] } },
                    2
                  ]
                }
              }
            }
          }
        },
        {
          $sort: {
            '_id.customer_id': 1,
            vegetableProbability: -1
          }
        },
        {
          $group: {
            _id: '$_id.customer_id',
            vegetables: {
              $push: {
                vegetable_id: '$_id.vegetable_id',
                vegetableName: '$vegetableName',
                vegetablePrice: '$vegetablePrice',
                predictedQuantity: '$predictedQuantity', // Already rounded up by $ceil
                probability: { $round: [{ $multiply: ['$vegetableProbability', 100] }, 1] },
                sameDayOrders: '$sameDayOrders',
                totalOrders: '$totalOrders',
                lastOrderDate: '$lastOrderDate'
              }
            }
          }
        },
        {
          $addFields: {
            vegetables: { $slice: ['$vegetables', 5] } // Top 5 vegetables per customer
          }
        }
      ]);
    }

    // Merge customer patterns with vegetable predictions
    const finalPredictions = customerOrderingPatterns.map(customer => {
      const vegetablePrediction = customerPredictions.find(vp => vp._id.equals(customer._id));
      const predictions = vegetablePrediction?.vegetables || [];

      // Calculate total predicted quantity for this customer
      const totalPredictedQuantity = predictions.reduce((sum, pred) => sum + pred.predictedQuantity, 0);

      return {
        _id: customer._id,
        customerName: customer.customerName,
        orderProbability: Math.round(customer.orderProbability * 100),
        dayOfWeekFrequency: Math.round(customer.dayOfWeekFrequency * 100),
        orderingCycleDays: Math.round(customer.orderingCycleDays),
        daysSinceLastOrder: Math.round(customer.daysSinceLastOrder),
        sameDayHistoricalOrders: customer.sameDayOrders,
        totalOrders: customer.totalOrders,
        lastOrderDate: customer.lastOrderDate,
        totalPredictedQuantity: totalPredictedQuantity,
        predictions: predictions
      };
    });

    // Calculate total predicted demand by aggregating from high-probability customers
    const vegetableDemandMap = new Map();

    // Aggregate predictions from high-probability customers
    finalPredictions.forEach(customer => {
      customer.predictions.forEach(pred => {
        const vegId = pred.vegetable_id.toString();
        const currentDemand = vegetableDemandMap.get(vegId) || {
          vegetable_id: pred.vegetable_id,
          vegetableName: pred.vegetableName,
          vegetablePrice: pred.vegetablePrice,
          predictedQuantity: 0,
          customerCount: 0,
          customers: []
        };

        currentDemand.predictedQuantity += pred.predictedQuantity;
        currentDemand.customerCount += 1;
        currentDemand.customers.push({
          name: customer.customerName,
          quantity: pred.predictedQuantity,
          probability: pred.probability
        });

        vegetableDemandMap.set(vegId, currentDemand);
      });
    });

    // Convert to array and add additional demand from historical data for vegetables not predicted
    let vegetableDemand = Array.from(vegetableDemandMap.values());

    // Get historical vegetable demand for this day to fill gaps
    const historicalDemand = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null }
        }
      },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$delivery_date' }
        }
      },
      {
        $match: {
          dayOfWeek: mongoTargetDay
        }
      },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderDetails'
        }
      },
      {
        $unwind: '$orderDetails'
      },
      {
        $lookup: {
          from: 'vegetables',
          localField: 'orderDetails.vegetable_id',
          foreignField: '_id',
          as: 'vegetable'
        }
      },
      {
        $unwind: '$vegetable'
      },
      {
        $group: {
          _id: '$orderDetails.vegetable_id',
          vegetableName: { $first: '$vegetable.name_th' },
          vegetablePrice: { $first: '$vegetable.price' },
          avgDailyQuantity: { $avg: '$orderDetails.quantity' },
          totalHistoricalQuantity: { $sum: '$orderDetails.quantity' },
          orderCount: { $sum: 1 },
          uniqueDates: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: '$delivery_date' } } }
        }
      },
      {
        $addFields: {
          avgQuantityPerDay: {
            $divide: ['$totalHistoricalQuantity', { $size: '$uniqueDates' }]
          }
        }
      },
      {
        $match: {
          orderCount: { $gte: 3 } // At least 3 historical orders on this day
        }
      },
      {
        $sort: { avgQuantityPerDay: -1 }
      }
    ]);

    // Add historical vegetables that weren't predicted by high-probability customers
    historicalDemand.forEach(hist => {
      const vegId = hist._id.toString();
      if (!vegetableDemandMap.has(vegId)) {
        // Estimate demand as 30% of historical average (conservative estimate for non-predicted vegetables)
        const estimatedQuantity = Math.round(hist.avgQuantityPerDay * 0.3 * 10) / 10;
        if (estimatedQuantity >= 0.5) { // Only include if estimated quantity is significant
          vegetableDemand.push({
            vegetable_id: hist._id,
            vegetableName: hist.vegetableName,
            vegetablePrice: hist.vegetablePrice,
            predictedQuantity: estimatedQuantity,
            customerCount: 0,
            customers: [],
            isHistoricalEstimate: true,
            historicalAvgPerDay: Math.round(hist.avgQuantityPerDay * 10) / 10
          });
        }
      }
    });

    // Sort by predicted quantity and round values
    vegetableDemand = vegetableDemand
      .map(veg => ({
        ...veg,
        predictedQuantity: Math.round(veg.predictedQuantity * 10) / 10
      }))
      .sort((a, b) => b.predictedQuantity - a.predictedQuantity)
      .slice(0, 15); // Top 15 vegetables

    return NextResponse.json({
      success: true,
      predictionDate: targetDate.toISOString().split('T')[0],
      dayOfWeek: {
        number: mongoTargetDay,
        name: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][targetDayOfWeek]
      },
      daysSkipped: daysChecked,
      customerPredictions: finalPredictions,
      overallVegetableDemand: vegetableDemand,
      totalCustomersWithPredictions: finalPredictions.length,
      analysisMetadata: {
        minimumOrderProbability: 15,
        minimumSameDayOrders: 2,
        minimumTotalOrders: 5,
        maxCustomersShown: 8,
        maxVegetablesPerCustomer: 5
      }
    });

  } catch (error) {
    console.error('Failed to generate order predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}