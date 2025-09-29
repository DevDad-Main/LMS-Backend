import Stripe from "stripe";
import { Course } from "../models/Course.model.js";
import { CoursePurchase } from "../models/CoursePurchase.model.js";
import { Lecture } from "../models/Lecture.model.js";
import { User } from "../models/User.model.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import mongoose, { isValidObjectId } from "mongoose";

/**
 * Create a Stripe checkout session for course purchase
 * @route POST /api/v1/payments/create-checkout-session
 */
export const initiateStripeCheckout = catchAsync(async (req, res) => {
  // TODO: Implement stripe checkout session creation functionality

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userId = req.user?._id;
    const { courses, total } = req.body;
    const { origin } = req.headers;

    console.log(req.body);
    console.log(origin);

    if (!isValidObjectId(userId)) {
      throw new AppError("Invalid User ID", 400);
    }

    if (courses.length === 0 || total === 0) {
      throw new AppError("Invalid Address or Items or Total Amount", 400);
    }

    const user = await User.findOne({ _id: userId }).session(session);

    if (!user) {
      throw new AppError("User Not Foundl, 404");
    }

    // Fetch all Courses safely
    const courseIds = courses.map(
      (c) => new mongoose.Types.ObjectId(c.product),
    );
    console.log("courseIds:", courseIds);
    console.log("courses raw:", courses);
    const coursesToBuy = await Course.find({ _id: { $in: courseIds } });

    // Build line items for Stripe
    const line_items = courses.map((item) => {
      const product = coursesToBuy.find((p) =>
        p._id.equals(new mongoose.Types.ObjectId(item.product)),
      );
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      return {
        price_data: {
          currency: "usd", // or "gbp" etc.
          product_data: {
            name: product.title,
          },
          unit_amount: Math.floor(product.price * 100),
        },
        quantity: 1,
      };
    });

    // Work out cart total
    const cartSubtotal = courses.reduce((acc, item) => {
      const product = coursesToBuy.find((p) => p._id.equals(item.product));
      return acc + product.price * 1;
    }, 0);

    // add tax line item (3% of cart total)
    // const taxAmount = Math.floor(cartSubtotal * threePercentTax * 100);

    // Calculate Total Points for the Order
    // const pointsTotal = courses.reduce((acc, item) => {
    //   const product = coursesToBuy.find((p) => p._id.equals(item.product));
    //   return acc + product.points * item.quantity;
    // }, 0);

    // if (cartSubtotal > 0) {
    //   line_items.push({
    //     price_data: {
    //       currency: "pln",
    //       product_data: {
    //         name: "Tax (3%)",
    //       },
    //       unit_amount: taxAmount,
    //     },
    //     quantity: 1,
    //   });
    // }

    // const draftOrder = await DraftOrder.findOne({ userId }).session(session);

    // if (draftOrder?.deliverySlot) {
    //   await DeliverySlot.findByIdAndUpdate(
    //     draftOrder.deliverySlot,
    //     {
    //       reservedBy: null,
    //       status: "available",
    //     },
    //     { session },
    //   );
    // }

    const order = new CoursePurchase({
      user: userId,
      courses: courses.map((course) => course.product),
      amount: cartSubtotal,
      paymentMethod: "Card",
      currency: "USD",
      status: "pending",
      paymentId: "51314534",
    });

    await order.save({ session });

    // Increment the users points total by the amount of the order

    // const stripeSession = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   line_items,
    //   mode: "payment",
    //   success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${origin}/cart`,
    //   metadata: {
    //     orderId: order._id.toString(),
    //   },
    // });

    const stripeInstance = new Stripe(process.env.STRIPE_SK);
    const stripeSession = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${origin}/loading?next=dashboard&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: user.email,
      payment_intent_data: {
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          coursesId: courses.map((c) => c.product).join(","), // Comma seperaated string otherwise we get an error
        },
      },
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      url: stripeSession.url,
      message: "Order Placed",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(error.status || 500).json({
      status: error.status || 500,
      message: error.message,
    });
  }
});

/**
 * Handle Stripe webhook events
 * @route POST /api/v1/payments/webhook
 */
export const handleStripeWebhook = catchAsync(async (req, res) => {
  // TODO: Implement stripe webhook handling functionality
});

/**
 * Get course details with purchase status
 * @route GET /api/v1/payments/courses/:courseId/purchase-status
 */
export const getCoursePurchaseStatus = catchAsync(async (req, res) => {
  // TODO: Implement get course purchase status functionality
});

/**
 * Get all purchased courses
 * @route GET /api/v1/payments/purchased-courses
 */
export const getPurchasedCourses = catchAsync(async (req, res) => {
  // TODO: Implement get purchased courses functionality
});
