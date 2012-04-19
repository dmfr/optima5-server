Ext.define('Ext.ux.form.field.DateTime', {
    extend:'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.datetimefield',
    layout: 'hbox',
    width: 200,
    height: 22,
    combineErrors: true,
    msgTarget :'side',
    invalidMsg : 'Invalid / empty date',
    allowBlank: true,

    dateCfg:{},
    timeCfg:{},
    isFormField: true,
    submitValue: true,

    initComponent: function() {
        var me = this;
        me.buildField();
        me.callParent();
        this.dateField = this.down('datefield');
        this.timeField = this.down('timefield');
        me.initField();
    },

    //@private
    buildField: function(){
        this.items = [
            Ext.apply({
                xtype: 'datefield',
                format: 'Y-m-d',
                width: 100 ,
		isFormField: false
            },this.dateCfg),
            Ext.apply({
                xtype: 'timefield',
                format: 'H:i',
                width: 80,
		isFormField: false
            },this.timeCfg)
        ]
    },

    getValue: function() {
        var value,date = this.dateField.getSubmitValue(),time = this.timeField.getSubmitValue();
        if(date){
            if(time){
                var format = this.getFormat() ;
                value = Ext.Date.parse(date + ' ' + time,format) ;
            }else{
                value = this.dateField.getValue() ;
            }
        }
        return value ;
    },
	   

    setValue: function(value){
	if( typeof value === 'string' ) {
	  value = new Date(value) ;
	}
        this.dateField.setValue(value) ;
        this.timeField.setValue(value) ;
    },

    getSubmitData: function(){
        var value = this.getValue() ;
        var format = this.getFormat() ;
        var strvalue = value ? Ext.Date.format(value, format) : null;
	var data = {} ;
	data[this.getName()] = strvalue ;
	return data ;
    },

    getFormat: function(){
        return (this.dateField.submitFormat || this.dateField.format) + " " + (this.timeField.submitFormat || this.timeField.format) ;
    },
	   
    markInvalid: function(errors) {
	if( this.dateField ) {
	  this.dateField.markInvalid(errors) ;
	}
    },

    clearInvalid: function() {
	// console.log('pouet') ;
	if( this.dateField ) {
	  this.dateField.clearInvalid() ;
	}
    },

    getErrors: function(value) {
	var me = this ,
	allowBlank = me.allowBlank ;
	
	if( !allowBlank && Ext.typeOf(value) !== 'date' ) {
	  return [me.invalidMsg] ;
	}
	return [] ;
    },
    validateValue: function(value) {
        var me = this,
            errors = me.getErrors(value),
            isValid = Ext.isEmpty(errors);
        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            } else {
                me.markInvalid(errors);
            }
        }

        return isValid;
    },
    isValid : function() {
        var me = this;
        return me.disabled || me.validateValue(me.getValue());
    }
	   
});