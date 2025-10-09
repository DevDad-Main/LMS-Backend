import Stripe from "stripe";
import { User } from "../models/User.model.js";
import { CoursePurchase } from "../models/CoursePurchase.model.js";
import { Course } from "../models/Course.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { CourseProgress } from "../models/CourseProgress.model.js";

//#region Post Confirm Stripe Session Payment
export const postConfirmPayment = async (req, res) => {
  const mongoSession = await mongoose.startSession();
  try {
    mongoSession.startTransaction();
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
        { new: true, runValidators: true, session: mongoSession },
      );

      console.log(coursesId);

      for (const courseId of coursesId) {
        await User.updateOne(
          { _id: userId, "enrolledCourses.course": { $ne: courseId } },
          {
            $push: {
              enrolledCourses: { course: courseId, enrolledAt: new Date() },
            },
          },
          { session: mongoSession },
        );
      }

      await User.findByIdAndUpdate(
        userId,
        { $set: { cart: [] } },
        { session: mongoSession },
      );

      for (const courseId of coursesId) {
        await CourseProgress.updateOne(
          { user: userId, course: courseId }, // find existing
          { user: userId, course: courseId }, // if not found, insert this
          { upsert: true, session: mongoSession },
        );
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      await Course.updateMany(
        {
          _id: { $in: coursesId.map((id) => new mongoose.Types.ObjectId(id)) },
        },
        { $addToSet: { enrolledStudents: userObjectId } },
        { session: mongoSession },
      );

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return res.status(200).json({
        success: true,
        message: "Payment confirmed",
      });
    } else {
      await CoursePurchase.findByIdAndDelete(orderId).session(mongoSession);
      // await Order.findByIdAndDelete(orderId);
      //
      // if (slotId) {
      //   await DeliverySlot.findByIdAndUpdate(slotId, {
      //     status: "available",
      //     reservedBy: null,
      //   });
      // }

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();

    return res.status(500).json({
      success: false,
      message: "Error confirming payment",
    });
  }
};
//#endregion
