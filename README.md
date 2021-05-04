---

copyright:
  years: 2019, 2020

---

<!-- Start with a short description that explains what the offering is, why a customer would want to install and use it, etc. The following info is used here as an example. Be sure to update it accordingly. -->

Bitnami charts for Helm are carefully engineered, actively maintained and are the quickest and easiest way to deploy containers on a Kubernetes cluster that are ready to handle production workloads.

In IBM Cloud, you you can configure your installation from the Create tab, and then install it with a single click instead of executing the Helm installation directly. Your Helm Chart is installed by using IBM Cloud Schematics, and after the installation is complete, you can view the chart instance, update the version, or uninstall from your Schematics workspace.

## Before you begin

<!-- List any prereqs including required permissions, capacity requirements, etc. The following info is used as an example. Update accordingly. -->

* Install the IBM Cloud Block Storage plug-in from the [catalog](https://cloud.ibm.com/catalog/content/ibmcloud-block-storage-plugin). 
* Download Kubernetes 1.12+ and Helm 2.11+ or Helm 3.0-beta3+.
* To successfully install the software, you must have the [administrator and manager roles](https://cloud.ibm.com/docs/iam?topic=iam-userroles#iamusermanrol) on the Kubernetes cluster service. 

## Required resources

<!-- The following info is used here as an example. Be sure to update it accordingly. -->

To run the software, the following resources are required:

  *  
  * 
  *

## Installing the software

<!-- Recommendation is to not include the large table of configuration parameters that are listed on the Create page. -->

### Production configuration

<!-- Add additional H3 level headings as needed for sections that apply to use on IBM Cloud such as network policy, persistence, cluster topologies, etc.
### H3
### H3
-->

## Upgrading to a new version

<!-- How can a user upgrade to a new version when it's available? The following info is used as an example. Update accordingly. -->

When a new version of a Helm Chart is available, you're alerted in your Schematics workspace. To upgrade to a new version, complete the following steps:

1. Go to the **Menu** > **Schematics**.
2. Select your workspace name. 
3. Click **Settings**. In the Summary section, your version number is displayed. 
4. Click **Update**.
5. Select a version, and click **Update**.

## Uninstalling the software

<!-- How can a user uninstall this offering? The following info is used as an example. Update accordingly. -->

Complete the following steps to uninstall a Helm Chart from your account. 

1. Go to the **Menu** > **Schematics**.
2. Select your workspace name. 
3. Click **Actions** > **Destroy resources**. All resources in your workspace are deleted.
4. Click **Update**.
5. To delete your workspace, click **Actions** > **Delete workspace**.

## Getting support

<!-- How can a user get support for this offering? The following info is used as an example. Update accordingly. -->

This product is provided and supported by [Bitnami](https://bitnami.com/). If you encounter any issues that require opening a support case, click **Get help?** at the beginning of this page to open a GitHub issue in the corresponding repository for this chart. Your issue will typically be answered in approximately 1 to 2 business days by the Bitnami support team.