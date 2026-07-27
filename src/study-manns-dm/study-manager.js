/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2026 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./templates/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import questHTML from "./templates/decision-making.html";
import demographicsHTML from "../templates/demographics.html";
import resultsHTML from "./templates/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";
import interventionHTML from "./templates/intervention.html";

//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbLITWTemplate = Handlebars.compile(irb_LITW_HTML);
let question1Template = Handlebars.compile(questHTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);
let interventionTemplate = Handlebars.compile(interventionHTML);

//TODO: document "config.study_id" when updating the docs/7-ManageData!!!
module.exports = (function(exports) {
	const study_times= {
		SHORT: 5,
		MEDIUM: 10,
		LONG: 15,
	};
	let timeline = [];
	let config = {
		questionsAndResponses: {},
		progressBarWidth: 0,
		questionOrderArray: [],
		numQuestions: 0,
		study_id: "fa42e461-c85f-4c23-8280-37054dafdc5d",
		study_recommendation: [],
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0',
		},
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: introTemplate,
				display_element_id: "intro",
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: irbLITWTemplate,
				display_element_id: "irb",
				template_data: {
					time: study_times.SHORT,
				},
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "demographics",
				name: "demographics",
				template: demographicsTemplate,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			INTERVENTION: {
				name: "intervention",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: interventionTemplate,
				display_element_id: "intervention",
				display_next_button: true,
			},
			QUESTION1: {
				name: "questionnaire",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question1Template,
				template_data: getStudyQuestions,
				display_element_id: "question1",
				display_next_button: false,
			},
			QUESTION2: {
				name: "questionnaire",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question1Template,
				template_data: getStudyQuestions,
				display_element_id: "question1",
				display_next_button: false,
			},
			QUESTION3: {
				name: "questionnaire",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question1Template,
				template_data: getStudyQuestions,
				display_element_id: "question1",
				display_next_button: false,
			},
			QUESTION4: {
				name: "questionnaire",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question1Template,
				template_data: getStudyQuestions,
				display_element_id: "question1",
				display_next_button: false,
			},
			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: commentsTemplate,
				display_element_id: "comments",
				display_next_button: true,
				finish: function(){
					var comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				name: "results",
				type: LITW.engine.SLIDE_TYPE.CALL_FUNCTION,
				display_next_button: false,
				call_fn: function(){
					calculateResults();
				}
			}
		}
	};

	function configureTimeline() {
		config.questionOrderArray = randomizeArray(createArray());
		timeline.push(config.slides.INTRODUCTION);
		timeline.push(config.slides.INFORMED_CONSENT);
		timeline.push(config.slides.DEMOGRAPHICS);
		const INTERVENTION_IDS = ["UNIQUE", "RESEARCH", "NEUTRAL"];
		config.intervention_chosen = INTERVENTION_IDS[Math.floor(Math.random() * INTERVENTION_IDS.length)];
		config.slides.INTERVENTION.template_data = () => {
			return {
				heading: $.i18n(`litw-study-intervention-${config.intervention_chosen}-heading`),
				body: $.i18n(`litw-study-intervention-${config.intervention_chosen}-body`)
			};
		}
		timeline.push(config.slides.INTERVENTION);
		timeline.push(config.slides.QUESTION1);
		timeline.push(config.slides.QUESTION2);
		timeline.push(config.slides.QUESTION3);
		timeline.push(config.slides.QUESTION4);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
		return timeline;
	}

	function getStudyQuestions() {
		let counter = 1;
		let numQ = 7;
		let numA = 3;
		let quest = {
			questions: [],
			responses: []
		}
		while(counter <= Math.max(numQ, numA)) {
			if (counter <= numQ) {
				quest.questions.push({
					id: config.questionOrderArray[counter - 1],
					text: $.i18n(`study-mann-q${config.questionOrderArray[counter - 1]}`)
				})
			}
			if (counter <= numA) {
				quest.responses.push({
					id: counter,
					text: $.i18n(`study-mann-r${counter}`)
				})
			}
			counter++;
		}
		config.progressBarWidth += 25;
		config.questionOrderArray.splice(0, 7);
		return quest;
	}

	function createArray() {
		let array = [];
		for (let index = 1; index < 29; index++) {
			array.push(index);
		}
		return array;
	}

	function randomizeArray(array) {
		return array.sort(() => (Math.random() > 0.5) ? 1 : -1);
	}

	function calculateResults() {
		let results_data = {};
    let vigilance = 0;
    let hypervigilance = 0;
    let buckpassing = 0;
    let procrastination = 0;
    let dmSelfEsteem = 0;
    for (const key in config.questionsAndResponses) {
    	if (key <= 6) {
      	vigilance += (config.questionsAndResponses[key] - 1);
      } else if (key <= 12) {
				buckpassing += (config.questionsAndResponses[key] - 1);
			} else if (key <= 17) {
				hypervigilance += (config.questionsAndResponses[key] - 1);
			} else if (key <= 22) {
				procrastination += (config.questionsAndResponses[key] - 1);
			} else {
				dmSelfEsteem += (config.questionsAndResponses[key] - 1);
			}
    }
   	results_data = {
			"vigilance": vigilance,
			"hypervigilance": hypervigilance,
			"buckpassing": buckpassing,
			"procrastination": procrastination,
			"selfEsteem": dmSelfEsteem
		}
		LITW.data.submitStudyData({results_data1 : results_data});
		chooseMessage(results_data);
		showResults(results_data, true)
	}

	function chooseMessage(results_data) {
		let num = Math.max(results_data.vigilance, results_data.hypervigilance, results_data.buckpassing, results_data.procrastination);
		if(num == results_data.vigilance) {
			results_data.message = $.i18n('litw-results-intro-v');
		} else if (num == results_data.hypervigilance) {
			results_data.message = $.i18n('litw-results-intro-hv');
		} else if(num == results_data.buckpassing) {
			results_data.message = $.i18n('litw-results-intro-bp');
		} else {
			results_data.message = $.i18n('litw-results-intro-p');
		}
	}

	function showResults(results = {}, showFooter = false) {
		if('PID' in LITW.data.getURLparams) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		$("#results").html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: config.study_recommendation
				}
			));
		}
		$("#results").i18n();
		LITW.utils.showSlide("results");
	}

	function bootstrap() {
		let good_config = LITW.engine.configure_study(config.preLoad, config.languages,
			configureTimeline(), config.study_id);
		if (good_config){
			LITW.data.submitStudyConfig({ intervention: config.intervention_chosen });
			LITW.engine.start_study();
		} else {
			console.error("Study configuration error!");
			//TODO fail nicely, maybe a page with useful info to send to the tech team?
		}
	}


	// when the page is loaded, start the study!
	$(document).ready(function() {
		bootstrap();
	});
	exports.study = {};
	exports.study.params = config

})( window.LITW = window.LITW || {} );


