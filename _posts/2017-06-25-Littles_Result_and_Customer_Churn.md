---
layout: post
title:  "Little's Result and Customer Churn Modeling"
date:   2017-06-25
categories: research, modeling, marketing
---

[Candy Japan](https://www.candyjapan.com) ships [boxes of Japanese 
candy](http://tvtropes.org/pmwiki/pmwiki.php/Main/ExactlyWhatItSaysOnTheTin)
to subscribers.

I'm not a customer, but I do enjoy checking out their
[Behind the Scenes](https://www.candyjapan.com/behind-the-scenes) blog
on the ins-and-outs of running a subscription business.

A [recent article](https://www.candyjapan.com/behind-the-scenes/twice-as-happy-half-the-price)
asked the question, "How many people would need to join each month to sustain 1000 subscribers?".

## Churn Rates

This is related to the concept of *customer churn*, which is a critical
issue for subscription-based businesses. The churn rate of a subscription
service is the fraction of customers that cancel service at the end of 
each billing period. For example, if a company has a churn rate of 50%, then half of its
current customers will drop the service at the end of the current period.

Churn is significant, because it effectively limits the growth of a subscription-
based business. When the business reaches a point where the rate of 
new customers entering matches the rate of existing customers churning,
it will not be able to grow further without making changes to increase
signups, decrease churn, or get more revenue from existing customers.

Bemmu, Candy Japan's owner and the author of the article, answers his question with a little thought experiment.
Imagine a business with a month-over-month churn rate of 50%.
Suppose the business is able to sign up 100 customers per month.

Consider an arbitrary month. During that month, the business will be
servicing:

  - The 100 new customers that just signed up
  - 50 customers that remained from the previous month and did not churn
  - 25 customers that originally subscribed two months ago and still have not churned after those two months
  - 12.5 customers (on average) that originally subscribed three months ago and still have not churned
  - And so forth, for all previous months
  
This is an infinite geometric series.

```
100 + 50 + 25 + 12.5 + 6.25 + 3.125 + ...
```

A little numerical computation 
will verify that the sum of these terms converges to 200 customers per month.
Therefore, under the assumptions of 50% churn rate and a recruitment
rate of 100 customers per month, the business will have an average of
200 customers in service at each period.

To get 1000 customers per month, multiply the input rate by 5 to find
you need 500 signups per period. Done!

## Little's Result

There is, however, another way to approach this problem, using
the fundamental laws of queueing and system dynamics.

This method requires a little more algebra than the numerical
simulations in Bemmu's article, but it illustrates a powerful 
modeling tool that can be used to answer many complex questions
about system behavior.

*Little's Result* (or Little's Law), named after JDC Little who first formulated it in
1954, relates three basic system quantities:

  - `N`, the average number of customers in a system at any moment in time
  - `X`, the throughput of the system. Throughput is deinfed as the 
  rate at which customers enter (or exit) the system. For the system
  to remain stable, the entry and exit rates must be, on average, identical.
  - `R`, the average time a customer spends in the system between
  entering and departing.
  
The Result states:

```
Average number in system = Throughput * Average time in system
```

or, using variables,

```
N = X R
```

What `F = m a` is to physics, Little's Result is to queueing 
and system dynamics. It makes no assumptions about the nature of the system under
consideration (such as the statistical properties of the arrival
and residence time processes), so it's a very general and powerful
result. The only practical requirement is that the three
quantities be statistically stable over the time period of interest.


Now, how to address the churn problem using Little's Result? The
motivating question was to find the rate of signups required to
sustain 1000 customers in the system, given a specific churn rate.

If the system is stable, the rate at which new customers enter must
match the rate at which existing customers leave, so the rate of new
signups we seek is the throughput `X`.

The desired average number of customers in system, `N`, is given as 1000.
Therefore, if we can determine the average residence time, `R`, the solution
is 

```
X = N / R
```

If the churn rate is 50%, then each customer behaves like a gambler 
flipping a coin. If the coin comes up heads, the customer chooses
to churn at the end of the current month. If it comes up tails, the 
customer chooses to remain in the system for an additional month.

How many flips, on average, will a customer make before the coin comes
up heads? This is the number of months that an average customer will
spend in the system before churning.

It turns out that this coin-flipping process is described
by a well-known probability distribution: the 
[**geometric distribution**](https://en.wikipedia.org/wiki/Geometric_distribution).
If the churn rate is `c`, the expected number of months (or coin flips)
before churning is

```
R = 1 / c
```

For example, if `c` is 50%, we'd expect each customer to spend
2 months before churning. If `c` is 25%, we'd expect to get
4 months of value before a churn, and if it's 10%, we'd expect
customers to remain for 10 months on average.

Now, to solve the original question: what rate of signups are 
required to sustain 1000 customers at 50% churn rate?

```
X = N / R

N = 1000 customers
R = 1 / .50 = 2 months

    1000 customers
X = -------------- = 500 customers per month
       2 months
```

The general solution is

```
Signup rate = Desired number of customers * Churn rate 
```

The average number of customers in the system at any partcular month
is available from the basic form of Little's Result:

```
     Average rate of new signups
N =  ---------------------------
            Churn rate
```

## Discussion

The power of analytic models like this is two-fold:

  1. They clearly expose the key variables that drive system performance.
  In this example, we've established that the number of customers in 
  the system depends on the rate of new signups and the churn rate.
  If you want to increase customers, those are the two knobs you have available
  to manipulate.
  
  2. They support *What If?* questions. For example, which change has the
  greater effect on customers: increasing new signups by 10% or reducing
  churn rate by 10%? The model makes it easy to verify that reducing churn
  rate is the better choice.

It turns out that many questions related to the dynamics of
subscription-based businesses and revenue generation can be
addressed using Little's Result.

Some further questions to ponder:

  - What if we were interested in the rate of revenue generation or
    the long-term value generated by each customer? It turns out
    that Little's Result can be used to derive those as well.
  - What if customers' churn behavior is not geometric and memoryless,
    but time dependent? For example, many real products are sticky,
    with long-term subscribers being less likely to churn than new arrivals.
  - What if the value of a customer changes over time, for example
  by selling upgrades?
  - What about early-stage companies, that are still in a rapid
  growth phase and haven't yet reached a steady-state?
  
Are you interested in this topic? Send me a note and let me know
your thoughts.


