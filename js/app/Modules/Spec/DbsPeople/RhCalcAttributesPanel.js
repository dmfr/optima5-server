Ext.define('Optima5.Modules.Spec.DbsPeople.RhCalcAttributesPanel',{
	extend:'Ext.tab.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsPeople.RhCalcAttributePanel'],
	
	cfgPeopleCalcAttributes: null,
	
	initComponent: function() {
		Ext.apply( this, {
			
		});
		this.callParent() ;
		if( this.peopleRecord ) {
			this.setPeopleRecord( this.peopleRecord ) ;
		}
	},
	setPeopleRecord: function( peopleRecord ) {
		var mapPeopleCalcAttributes = {} ;
		if( this.cfgPeopleCalcAttributes ) {
			Ext.Array.each( this.cfgPeopleCalcAttributes, function(attr) {
				mapPeopleCalcAttributes[attr.peopleCalcAttribute] = attr.text ;
			});
		}
		
		var peopleName = peopleRecord.get('people_name'),
			attributePanels = [] ;
		peopleRecord.calc_attributes().each( function(peopleCalcAttributeRecord) {
			var peopleCalcAttributeData = peopleCalcAttributeRecord.getData(true) ;
			Ext.apply(peopleCalcAttributeData,{
				_people_name: peopleName,
				_people_calc_attribute_text: mapPeopleCalcAttributes[peopleCalcAttributeData.people_calc_attribute]
			});
			
			attributePanels.push( Ext.create('Optima5.Modules.Spec.DbsPeople.RhCalcAttributePanel',{
				itemId: peopleCalcAttributeData.people_calc_attribute,
				title: peopleCalcAttributeData.people_calc_attribute,
				panelData: peopleCalcAttributeData
			}));
		}) ;
		
		this.removeAll() ;
		if( attributePanels.length > 0 ) {
			this.add(attributePanels) ;
			this.setActiveTab(this.activePeopleCalcAttribute) ;
		}
	}
}) ;