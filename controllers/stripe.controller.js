import Stripe from "stripe";
import { User } from "../models/User.model.js";
import { CoursePurchase } from "../models/CoursePurchase.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { CourseProgress } from "../models/CourseProgress.model.js";

//#region Post Confirm Stripe Session Payment
export const postConfirmPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const stripe = new Stripe(process.env.STRIPE_SK);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    console.log("Session: ", session);
    const { orderId, userId } = session.payment_intent.metadata;
    const coursesId = session.payment_intent.metadata.coursesId.split(",");

    const paymentIntentId = session.payment_intent;

    if (session.payment_status === "paid") {
      await CoursePurchase.findByIdAndUpdate(
        orderId,
        { paymentId: paymentIntentId.id, status: "completed" },
        { new: true, runValidators: true },
      );

      console.log(coursesId);

      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          enrolledCourses: {
            $each: coursesId.map((id) => ({
              course: new mongoose.Types.ObjectId(id),
              enrolledAt: new Date(),
            })),
          },
        },
        $set: { cart: [] },
      });

      for (const courseId of coursesId) {
        const exists = await CourseProgress.findOne({
          user: userId,
          course: courseId,
        });
        if (!exists) {
          await CourseProgress.create({
            user: userId,
            course: courseId,
          });
        }
      }

      // await User.findByIdAndUpdate(req.user?._id, { $set: { cart: [] } });

      return res.status(200).json({
        success: true,
        message: "Payment confirmed",
      });
    } else {
      await CoursePurchase.findByIdAndDelete(orderId);
      // await Order.findByIdAndDelete(orderId);
      //
      // if (slotId) {
      //   await DeliverySlot.findByIdAndUpdate(slotId, {
      //     status: "available",
      //     reservedBy: null,
      //   });
      // }

      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error confirming payment",
    });
  }
};
//#endregion
